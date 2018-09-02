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
const class_validator_1 = require("class-validator");
const search_term_internal_1 = __importDefault(require("../models/internal/search-term.internal"));
class BaseService {
    constructor(repository) {
        this.repository = repository;
    }
    validId(id) {
        return id !== undefined && id > 0;
    }
    isValid(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = yield class_validator_1.validate(entity, {
                    validationError: { target: false, value: false }
                });
                if (errors.length > 0) {
                    throw boom_1.default.badRequest('Validation failed on the provided request', errors);
                }
                return true;
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.badRequest('Unable to validate request: ' + error);
            }
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.getAll();
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    findAllByFilter(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.findManyByFilter(filter);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    findOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validId(id) || isNaN(id)) {
                    throw boom_1.default.badRequest('Incorrect / invalid parameters supplied');
                }
                return yield this.repository.findOneById(id);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    findOneByFilter(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.findOneByFilter(filter);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    findOneWithQueryBuilder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const entityResult = yield this.repository.findOneWithQueryBuilder(options);
                if (entityResult) {
                    return entityResult;
                }
                else {
                    throw boom_1.default.notFound('The requested object could not be found');
                }
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    findManyWithQueryBuilder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.findManyWithQueryBuilder(options);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    search(limit, searchTerms) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = this.getSearchFilter(limit, searchTerms);
                return yield this.findManyWithQueryBuilder(filter);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    save(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const entityIsValid = yield this.isValid(entity);
                if (!entityIsValid) {
                    throw boom_1.default.badRequest('Incorrect / invalid parameters supplied');
                }
                return yield this.repository.save(entity);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    update(entity, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const entityIsValid = yield this.isValid(entity);
                if (!entityIsValid || !this.validId(id)) {
                    throw boom_1.default.badRequest('Incorrect / invalid parameters supplied');
                }
                return yield this.repository.updateOneById(id, entity);
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validId(id)) {
                    throw boom_1.default.badRequest('Incorrect / invalid parameters supplied');
                }
                const entityResult = yield this.repository.findOneById(id);
                yield this.repository.delete(entityResult);
                return entityResult;
            }
            catch (error) {
                if (boom_1.default.isBoom(error)) {
                    throw boom_1.default.boomify(error);
                }
                throw boom_1.default.internal(error);
            }
        });
    }
    getSearchFilter(limit, searchTerms) {
        if (limit >= 0 && searchTerms && searchTerms.length > 0) {
            let whereClause = '';
            const andWhereClause = [];
            for (const searchTerm of searchTerms) {
                const term = search_term_internal_1.default.newSearchTerm(searchTerm);
                let quoteValue = true;
                if (searchTerm.value.startsWith('(') &&
                    searchTerm.value.endsWith(')')) {
                    quoteValue = false;
                }
                const value = quoteValue ? `'${term.value}'` : `${term.value}`;
                if (!whereClause || whereClause === '') {
                    whereClause = `${term.field} ${term.operator ? term.operator : ' = '} ${value}`;
                }
                else {
                    andWhereClause.push(`${term.field} ${term.operator ? term.operator : ' = '} ${value}`);
                }
            }
            return {
                where: whereClause,
                andWhere: andWhereClause,
                limit
            };
        }
        else {
            throw boom_1.default.badRequest('Incorrect / invalid parameters supplied');
        }
    }
}
exports.default = BaseService;
