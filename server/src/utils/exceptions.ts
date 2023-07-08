export class MissingToken extends Error{
	constructor(message = "missing token"){
		super(message);
	}
}

export class DatasetNotFound extends Error{
	constructor(message = "Dataset not found"){
		super(message);
	}
}

export class DatasetNotValid extends Error{
	constructor(message = "Dataset inserted is not valid"){
		super(message);
	}
}