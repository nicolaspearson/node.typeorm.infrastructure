"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SearchTerm {
    static newSearchTerm(obj) {
        const newSearchTerm = new SearchTerm();
        if (obj.field) {
            newSearchTerm.field = obj.field;
        }
        if (obj.value) {
            newSearchTerm.value = obj.value;
        }
        if (obj.operator) {
            newSearchTerm.operator = obj.operator;
        }
        return newSearchTerm;
    }
}
exports.default = SearchTerm;
