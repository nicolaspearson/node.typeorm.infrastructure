export default class SearchTerm {
	public field: string;

	public value: string;

	public operator: string;

	public static newSearchTerm(obj: {
		field?: string;
		value?: string;
		operator?: string;
	}) {
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
