/*
	custom error class definitions
*/

export class MissingToken extends Error{
	constructor(message = "missing token"){
		super(message);
	}
}

export class MismatchedUser extends Error{
	constructor(message = "mismatched user"){
		super(message);
	}
}

export class MismatchedDatasetOwner extends Error{
	constructor(message = "mismatched dataset owner"){
		super(message);
	}
}

export class RestrictedToAdmin extends Error{
	constructor(message = "restricted to admin"){
		super(message);
	}
}

export class LoginFailed extends Error{
	constructor(message = "login failed"){
		super(message);
	}
}

export class UserNotFound extends Error{
	constructor(message = "user not found"){
		super(message);
	}
}

export class DatasetNotFound extends Error{
	constructor(message = "dataset not found"){
		super(message);
	}
}

export class ModelNotFound extends Error{
	constructor(message = "model not found"){
		super(message);
	}
}

export class DatasetNotValid extends Error{
	constructor(message = "dataset is not valid"){
		super(message);
	}
}

export class InvalidFile extends Error{
	constructor(message = "file is not valid"){
		super(message);
	}
}

export class FileNotFoundError extends Error{
	constructor(message = "file not found"){
		super(message);
	}
}

export class EmailAlreadyExists extends Error{
	constructor(message = "email already exists"){
		super(message);
	}
}

export class NameAlreadyExists extends Error{
	constructor(message = "name already exists"){
		super(message);
	}
}

export class NotEnoughCredits extends Error{
	constructor(message = "not enough credits to complete the action"){
		super(message);
	}
}

export class BboxSyntaxError extends Error{
	constructor(message = "the bbox must have 4 values"){
		super(message);
	}
}

export class FileFormatError extends Error{
	constructor(message = "the format of the file is not accepted"){
		super(message);
	}
}

export class ExtensionNotMatched extends Error{
	constructor(message = "extensions not matching between image and dataset"){
		super(message);
	}
}
export class InferenceError extends Error{
	constructor(message = "error encountered during inference"){
		super(message);
	}
}