"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("boom"));
const typeorm_1 = require("typeorm");
class BaseRepository {
    constructor(entityName) {
        this.entityName = entityName;
    }
    getRepository() {
        return typeorm_1.getManager().getRepository(this.entityName);
    }
    getQueryBuilder() {
        return typeorm_1.getManager()
            .getRepository(this.entityName)
            .createQueryBuilder(this.entityName);
    }
    executeRepositoryFunction(repositoryFunction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield repositoryFunction;
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                if (error instanceof typeorm_1.QueryFailedError) {
                    throw boom_1.default.internal(error.message);
                }
                throw boom_1.default.badRequest(error);
            }
        });
    }
    getAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.executeRepositoryFunction(this.getRepository().find(options));
        });
    }
    findManyByFilter(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield this.executeRepositoryFunction(this.getRepository().find(options));
            if (!records) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found`);
            }
            return records;
        });
    }
    findOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.executeRepositoryFunction(this.getRepository().findOne(id));
            if (!record) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found: ${id}`);
            }
            return record;
        });
    }
    findOneByIdWithOptions(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.executeRepositoryFunction(this.getRepository().findByIds(new Array(id), options));
            if (!record) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found: ${id}`);
            }
            return record;
        });
    }
    findManyById(idList, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield this.executeRepositoryFunction(this.getRepository().findByIds(idList, options));
            if (!records || records.length < 1) {
                throw boom_1.default.notFound(`${this.entityName}: None of the requested records were not found: ${JSON.stringify(idList)}`);
            }
            return records;
        });
    }
    findOneByFilter(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.executeRepositoryFunction(this.getRepository().findOne(options));
            if (!record) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found`);
            }
            return record;
        });
    }
    save(record, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.executeRepositoryFunction(this.getRepository().save(record, options));
            if (!result) {
                throw boom_1.default.notFound(`${this.entityName}: The record was not saved: ${record}`);
            }
            if (result.id) {
                return this.findOneById(result.id);
            }
            return result;
        });
    }
    saveAll(records, options, resolveRelations) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.executeRepositoryFunction(this.getRepository().save(records, options));
            if (!results) {
                throw boom_1.default.notFound(`${this.entityName}: The records were not saved`);
            }
            if (resolveRelations) {
                const eagerResults = [];
                for (const result of results) {
                    if (result.id) {
                        eagerResults.push(yield this.findOneById(result.id));
                    }
                }
                return eagerResults;
            }
            return results;
        });
    }
    updateOneById(id, record, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundRecord = yield this.findOneById(id);
            if (!foundRecord) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found: ${id}`);
            }
            yield this.executeRepositoryFunction(this.getRepository().update(id, record, options));
            return this.findOneById(id);
        });
    }
    delete(record, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.executeRepositoryFunction(this.getRepository().remove(record, options));
        });
    }
    deleteOneById(id, findOptions, deleteOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let record;
            if (findOptions) {
                record = yield this.findOneByIdWithOptions(id, findOptions);
            }
            else {
                record = yield this.findOneById(id);
            }
            if (!record) {
                throw boom_1.default.notFound(`${this.entityName}: The requested record was not found: ${id}`);
            }
            return yield this.delete(record, deleteOptions);
        });
    }
    deleteManyById(idList, deleteOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield this.findManyById(idList);
            if (!records || records.length < 1) {
                throw boom_1.default.notFound(`${this.entityName}: None of the requested records were not found: ${JSON.stringify(idList)}`);
            }
            return yield this.executeRepositoryFunction(this.getRepository().remove(records, deleteOptions));
        });
    }
    findOneWithQueryBuilder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryBuilder = this.getQueryBuilder();
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
            return yield queryBuilder.getOne();
        });
    }
    findManyWithQueryBuilder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryBuilder = this.getQueryBuilder();
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
            return yield queryBuilder.getMany();
        });
    }
}
exports.default = BaseRepository;
