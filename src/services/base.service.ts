import Boom from 'boom';
import { validate, ValidationError } from 'class-validator';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import SearchTerm from '../models/internal/search-term.internal';
import { ISearchQueryBuilderOptions } from '../models/options/search-query-builder.options';
import BaseRepository from '../repositories/base.repository';

export default abstract class BaseService<T> {
	constructor(private repository: BaseRepository<T>) {
		// Empty constructor
	}

	public validId(id: number): boolean {
		return id !== undefined && id > 0;
	}

	public async isValid(entity: T): Promise<boolean> {
		try {
			const errors: ValidationError[] = await validate(entity, {
				validationError: { target: false, value: false }
			});
			if (errors.length > 0) {
				throw Boom.badRequest(
					'Validation failed on the provided request',
					errors
				);
			}
			return true;
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.badRequest('Unable to validate request: ' + error);
		}
	}

	public async findAll(): Promise<T[]> {
		try {
			return await this.repository.getAll();
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async findAllByFilter(filter: FindManyOptions<T>): Promise<T[]> {
		try {
			return await this.repository.findManyByFilter(filter);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async findOneById(id: number): Promise<T> {
		try {
			if (!this.validId(id) || isNaN(id)) {
				throw Boom.badRequest(
					'Incorrect / invalid parameters supplied'
				);
			}
			return await this.repository.findOneById(id);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async findOneByFilter(filter: FindOneOptions<T>): Promise<T> {
		try {
			return await this.repository.findOneByFilter(filter);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T> {
		try {
			const entityResult = await this.repository.findOneWithQueryBuilder(
				options
			);
			if (entityResult) {
				return entityResult;
			} else {
				throw Boom.notFound('The requested object could not be found');
			}
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async findManyWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T[]> {
		try {
			return await this.repository.findManyWithQueryBuilder(options);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async search(limit: number, searchTerms: SearchTerm[]) {
		try {
			const filter = this.getSearchFilter(limit, searchTerms);
			return await this.findManyWithQueryBuilder(filter);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async save(entity: T): Promise<T> {
		try {
			// Check if the entity is valid
			const entityIsValid = await this.isValid(entity);
			if (!entityIsValid) {
				throw Boom.badRequest(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Save the entity to the database
			return await this.repository.save(entity);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async update(entity: T, id: number): Promise<T> {
		try {
			// Check if the entity is valid
			const entityIsValid = await this.isValid(entity);
			if (!entityIsValid || !this.validId(id)) {
				throw Boom.badRequest(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Update the entity on the database
			return await this.repository.updateOneById(id, entity);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async delete(id: number): Promise<T> {
		try {
			if (!this.validId(id)) {
				throw Boom.badRequest(
					'Incorrect / invalid parameters supplied'
				);
			}
			const entityResult: T = await this.repository.findOneById(id);
			await this.repository.delete(entityResult);
			return entityResult;
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public getSearchFilter(
		limit: number,
		searchTerms: SearchTerm[]
	): ISearchQueryBuilderOptions {
		if (limit >= 0 && searchTerms && searchTerms.length > 0) {
			let whereClause = '';
			const andWhereClause: string[] = [];
			for (const searchTerm of searchTerms) {
				const term = SearchTerm.newSearchTerm(searchTerm);
				let quoteValue = true;
				if (
					searchTerm.value.startsWith('(') &&
					searchTerm.value.endsWith(')')
				) {
					quoteValue = false;
				}
				const value = quoteValue ? `'${term.value}'` : `${term.value}`;
				if (!whereClause || whereClause === '') {
					whereClause = `${term.field} ${
						term.operator ? term.operator : ' = '
					} ${value}`;
				} else {
					andWhereClause.push(
						`${term.field} ${
							term.operator ? term.operator : ' = '
						} ${value}`
					);
				}
			}
			return {
				where: whereClause,
				andWhere: andWhereClause,
				limit
			};
		} else {
			throw Boom.badRequest('Incorrect / invalid parameters supplied');
		}
	}
}
