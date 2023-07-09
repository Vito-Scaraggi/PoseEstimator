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
	constructor(message = "Dataset inserted is not valid"){
		super(message);
	}
}