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

declare class SearchTerm {
	field: string;
	value: string;
	operator: string;
	static newSearchTerm(obj: {
		field?: string;
		value?: string;
		operator?: string;
	}): SearchTerm;
}

declare interface ISearchQueryBuilderOptions {
	where: string;
	andWhere?: string[];
	orWhere?: string[];
	limit?: number;
}

declare class BaseRepository<T> {
	private entityName: string;
	constructor(entityName: string);
	protected getRepository(): Repository<T>;
	protected getQueryBuilder(): SelectQueryBuilder<T>;
	executeRepositoryFunction(repositoryFunction: Promise<any>): Promise<any>;
	getAll(options?: FindManyOptions<T>): Promise<T[]>;
	findManyByFilter(options: FindManyOptions<T>): Promise<T[]>;
	findOneById(id: number): Promise<T>;
	findOneByIdWithOptions(id: number, options?: FindOneOptions<T>): Promise<T>;
	findManyById(idList: number[], options?: FindOneOptions<T>): Promise<T[]>;
	findOneByFilter(options: FindOneOptions<T>): Promise<T>;
	save(record: T, options?: SaveOptions): Promise<T>;
	saveAll(
		records: T[],
		options?: SaveOptions,
		resolveRelations?: boolean
	): Promise<T[]>;
	updateOneById(id: number, record: T, options?: SaveOptions): Promise<T>;
	delete(record: T, options?: RemoveOptions): Promise<T>;
	deleteOneById(
		id: number,
		findOptions?: FindOneOptions<T>,
		deleteOptions?: RemoveOptions
	): Promise<T>;
	deleteManyById(idList: number[], deleteOptions?: RemoveOptions): Promise<T>;
	findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T | undefined>;
	findManyWithQueryBuilder(options: ISearchQueryBuilderOptions): Promise<T[]>;
}

declare class BaseService<T> {
	constructor(repository: BaseRepository<T>);
	validId(id: number): boolean;
	isValid(entity: T): Promise<boolean>;
	findAll(): Promise<T[]>;
	findAllByFilter(filter: FindManyOptions<T>): Promise<T[]>;
	findOneById(id: number): Promise<T>;
	findOneByFilter(filter: FindOneOptions<T>): Promise<T>;
	findOneWithQueryBuilder(options: ISearchQueryBuilderOptions): Promise<T>;
	findManyWithQueryBuilder(options: ISearchQueryBuilderOptions): Promise<T[]>;
	search(limit: number, searchTerms: SearchTerm[]): Promise<T[]>;
	save(entity: T): Promise<T>;
	update(entity: T, id: number): Promise<T>;
	delete(id: number): Promise<T>;
	getSearchFilter(
		limit: number,
		searchTerms: SearchTerm[]
	): ISearchQueryBuilderOptions;
}

export { BaseRepository, BaseService, ISearchQueryBuilderOptions, SearchTerm };
