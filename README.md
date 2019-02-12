# Typeorm Infrastructure

Simple generic class implementation for [TypeORM](http://typeorm.io) utilising the repository pattern.

## Installation

```
npm install typeorm-infrastructure --save
```

## Usage

### Step 1:

Create a TypeORM entity:

```typescript
import Boom from 'boom';
import {
	IsEmail,
	IsOptional,
	Length,
	validate,
	ValidationArguments,
	ValidationError
} from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'user' })
export class User {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ name: 'username', length: 255 })
	@Length(3, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public username: string;

	@Column({ name: 'password', length: 255 })
	@Length(4, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	@IsOptional()
	public password: string;

	@Column({ name: 'email_address', length: 255 })
	@IsEmail(
		{},
		{
			message: 'Must be a valid email address'
		}
	)
	public emailAddress: string;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	public static newUser(obj: {
		id?: number;
		username?: string;
		emailAddress?: string;
		password?: string;
	}) {
		const newUser = new User();
		if (obj.id) {
			newUser.id = obj.id;
		}
		if (obj.username) {
			newUser.username = obj.username;
		}
		if (obj.emailAddress) {
			newUser.emailAddress = obj.emailAddress;
		}
		if (obj.password) {
			newUser.password = obj.password;
		}
		return newUser;
	}

	public static getGenericValidationLengthMessage(args: ValidationArguments) {
		return 'Incorrect length: Found ' + args.constraints[0] + ' characters';
	}
}
```

### Step 2:

Create a repository for the entity above:

```typescript
import { BaseRepository } from 'typeorm-infrastructure';

export default class UserRepository extends BaseRepository<User> {
	constructor() {
		super(User.name);
	}
}
```

### Step 3:

Create a service for the entity above:

```typescript
import { BaseService } from 'typeorm-infrastructure';

export default class UserService extends BaseService<User> {
	constructor(private repository: UserRepository) {
		super(repository);
	}
}
```

## Repository API

The base repository will give you access to the following methods:

```typescript
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
delete(record: T, options?: RemoveOptions);
```

## Service API

The base service will give you access to the following methods:

```typescript
preSaveHook(entity: T): void;
preUpdateHook(entity: T): void;
validId(id: number): boolean;
isValid(entity: T): Promise<boolean>;
findAll(): Promise<T[]>;
findAllByFilter(filter: FindManyOptions<T>): Promise<T[]>;
findOneById(id: number): Promise<T>;
findOneByFilter(filter: FindOneOptions<T>): Promise<T>;
findOneWithQueryBuilder(options: ISearchQueryBuilderOptions): Promise<T>;
findManyWithQueryBuilder(options: ISearchQueryBuilderOptions): Promise<T[]>;
search(limit: number, searchTerms: SearchTerm[]);
save(entity: T): Promise<T>;
update(entity: T, id: number): Promise<T>;
getSearchFilter(
	limit: number,
	searchTerms: SearchTerm[]
): ISearchQueryBuilderOptions;
delete(id: number): Promise<T>;
```
