import Boom from 'boom';
import {
	FindManyOptions,
	FindOneOptions,
	getManager,
	QueryFailedError,
	RemoveOptions,
	Repository,
	SaveOptions,
	SelectQueryBuilder
} from 'typeorm';

import { ISearchQueryBuilderOptions } from '../models/options/search-query-builder.options';

export default abstract class BaseRepository<T> {
	private entityName: string;

	constructor(entityName: string) {
		this.entityName = entityName;
	}

	protected getRepository(): Repository<T> {
		return getManager().getRepository(this.entityName);
	}

	protected getQueryBuilder(): SelectQueryBuilder<T> {
		return getManager()
			.getRepository<T>(this.entityName)
			.createQueryBuilder(this.entityName);
	}

	/**
	 * This function wraps the execution of all repository calls
	 * in a generic try-catch in order to decrease duplication,
	 * and centralize error handling. All calls to the repository
	 * should be wrapped in this function
	 *
	 * @param repositoryFunction Promise<any>: The repository function that should be executed
	 */
	public async executeRepositoryFunction(
		repositoryFunction: Promise<any>
	): Promise<any> {
		try {
			return await repositoryFunction;
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			if (error instanceof QueryFailedError) {
				throw Boom.internal(error.message);
			}
			throw Boom.badRequest(error);
		}
	}

	public async getAll(options?: FindManyOptions<T>): Promise<T[]> {
		return await this.executeRepositoryFunction(
			this.getRepository().find(options)
		);
	}

	public async findManyByFilter(options: FindManyOptions<T>): Promise<T[]> {
		const records: T[] = await this.executeRepositoryFunction(
			this.getRepository().find(options)
		);
		if (!records) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found`
			);
		}
		return records;
	}

	public async findOneById(id: number): Promise<T> {
		const record: T = await this.executeRepositoryFunction(
			this.getRepository().findOne(id)
		);
		if (!record) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found: ${id}`
			);
		}
		return record;
	}

	public async findOneByIdWithOptions(
		id: number,
		options?: FindOneOptions<T>
	): Promise<T> {
		const record: T = await this.executeRepositoryFunction(
			this.getRepository().findByIds(new Array(id), options)
		);
		if (!record) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found: ${id}`
			);
		}
		return record;
	}

	public async findManyById(
		idList: number[],
		options?: FindOneOptions<T>
	): Promise<T[]> {
		const records: T[] = await this.executeRepositoryFunction(
			this.getRepository().findByIds(idList, options)
		);
		if (!records || records.length < 1) {
			throw Boom.notFound(
				`${
					this.entityName
				}: None of the requested records were not found: ${JSON.stringify(
					idList
				)}`
			);
		}
		return records;
	}

	public async findOneByFilter(options: FindOneOptions<T>): Promise<T> {
		const record = await this.executeRepositoryFunction(
			this.getRepository().findOne(options)
		);
		if (!record) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found`
			);
		}
		return record;
	}

	public async save(record: T, options?: SaveOptions): Promise<T> {
		const result: any = await this.executeRepositoryFunction(
			this.getRepository().save(record, options)
		);
		if (!result) {
			throw Boom.notFound(
				`${this.entityName}: The record was not saved: ${record}`
			);
		}
		if (result.id) {
			// Use find to automatically resolve eager relations
			return this.findOneById(result.id);
		}
		return result;
	}

	public async saveAll(
		records: T[],
		options?: SaveOptions,
		resolveRelations?: boolean
	): Promise<T[]> {
		const results: any = await this.executeRepositoryFunction(
			this.getRepository().save(records, options)
		);
		if (!results) {
			throw Boom.notFound(
				`${this.entityName}: The records were not saved`
			);
		}

		if (resolveRelations) {
			const eagerResults: T[] = [];
			for (const result of results) {
				if (result.id) {
					// Use find to automatically resolve eager relations
					eagerResults.push(await this.findOneById(result.id));
				}
			}
			return eagerResults;
		}
		return results;
	}

	public async updateOneById(
		id: number,
		record: T,
		options?: SaveOptions
	): Promise<T> {
		const foundRecord = await this.findOneById(id);
		if (!foundRecord) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found: ${id}`
			);
		}
		await this.executeRepositoryFunction(
			this.getRepository().update(id, record, options)
		);
		// Use find to automatically resolve eager relations
		return this.findOneById(id);
	}

	public async delete(record: T, options?: RemoveOptions): Promise<T> {
		return await this.executeRepositoryFunction(
			this.getRepository().remove(record, options)
		);
	}

	public async deleteOneById(
		id: number,
		findOptions?: FindOneOptions<T>,
		deleteOptions?: RemoveOptions
	): Promise<T> {
		let record: T | undefined;
		if (findOptions) {
			record = await this.findOneByIdWithOptions(id, findOptions);
		} else {
			record = await this.findOneById(id);
		}

		if (!record) {
			throw Boom.notFound(
				`${this.entityName}: The requested record was not found: ${id}`
			);
		}
		return await this.delete(record, deleteOptions);
	}

	public async deleteManyById(
		idList: number[],
		deleteOptions?: RemoveOptions
	): Promise<T> {
		const records = await this.findManyById(idList);
		if (!records || records.length < 1) {
			throw Boom.notFound(
				`${
					this.entityName
				}: None of the requested records were not found: ${JSON.stringify(
					idList
				)}`
			);
		}
		return await this.executeRepositoryFunction(
			this.getRepository().remove(records, deleteOptions)
		);
	}

	public async findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T | undefined> {
		const queryBuilder: SelectQueryBuilder<T> = this.getQueryBuilder();
		queryBuilder.where(options.where);
		if (options.andWhere) {
			for (const and of options.andWhere) {
				queryBuilder.andWhere(and);
			}
		}
		if (options.orWhere) {
			for (const or of options.orWhere) {
				queryBuilder.orWhere(or);
			}
		}
		queryBuilder.limit(1);
		return await queryBuilder.getOne();
	}

	public async findManyWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T[]> {
		const queryBuilder: SelectQueryBuilder<T> = this.getQueryBuilder();
		queryBuilder.where(options.where);
		if (options.andWhere) {
			for (const and of options.andWhere) {
				queryBuilder.andWhere(and);
			}
		}
		if (options.orWhere) {
			for (const or of options.orWhere) {
				queryBuilder.orWhere(or);
			}
		}
		if (options.limit && options.limit > 0) {
			queryBuilder.limit(options.limit);
		}
		return await queryBuilder.getMany();
	}
}
