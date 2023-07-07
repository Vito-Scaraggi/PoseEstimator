export class MissingToken extends Error{
	constructor(message = "missing token"){
		super(message);
	}
}