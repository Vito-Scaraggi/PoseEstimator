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
	constructor(message = "Dataset is not valid"){
		super(message);
	}
}

export class InvalidFile extends Error{
	constructor(message = "File is not valid"){
		super(message);
	}
}

export class FileNotFoundError extends Error{
	constructor(message = "File not found"){
		super(message);
	}
}