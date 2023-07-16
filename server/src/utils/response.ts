import {StatusCodes} from 'http-status-codes';
import { Response as Res } from 'express'

// response object 
class Response {

	// status code
	status : StatusCodes;
	// message
	message : {};

	constructor(status : StatusCodes, message : any ){
		this.status = status;
		// build message json object
		switch(typeof message){
			case 'undefined':
				this.message = 	{ "message" : "unknown" };
			break;
			case 'string':
				this.message = 	{ "message" : message };
			break;
			default:
				this.message = message;
			break;
		}
	}

}

// class that creates response objects
class ResponseFactory{

	// map status to list of errors
	private static statusToErrors : { [key in StatusCodes]? : string[]} = 
	{
		[StatusCodes.UNAUTHORIZED] : ["MissingToken", "JsonWebTokenError", "TokenExpiredError", 
			"NotBeforeError", "LoginFailed", "NotEnoughCredits"],
		[StatusCodes.FORBIDDEN] : ["MismatchedUser", "MismatchedDatasetOwner", 
			"RestrictedToAdmin"],
		[StatusCodes.BAD_REQUEST] : ["FileFormatError", "DatasetFormatError", 
			"NameAlreadyExists", "ExtensionNotMatched"],
		[StatusCodes.NOT_FOUND] : ["DatasetNotFound", "FileNotFoundError",
			"UserNotFound", "ModelNotFound"]
	};

	//get status for given error if defined
	static getStatus(errorName : string){
		return Object.entries(ResponseFactory.statusToErrors)
		.map((item) => item[1].includes(errorName) ? 
				Number(item[0]).valueOf() : undefined )
		.reduce((acc, item) => acc? acc : item);
	}

	// parse Zod exception message to create
	// more readable message

	static parseZod(message : string){
		const errObj = JSON.parse(message);
		return {
			"message" : "bad request",
			"validation" : errObj.map( (elem:any) => elem.message).
										filter( (elem:any) => elem !== undefined )
		}
	}

	// create response object in case of error
	static getErrResponse(err : Error){
		let ret : Response | null = null;
		
		// creates different response object
		// depending on type of error thrown
		
		switch(err.constructor.name){
			case "DatabaseError":
				ret = new Response(StatusCodes.INTERNAL_SERVER_ERROR, "database error");
			break;
			case "ZodError":
				ret = new Response(StatusCodes.BAD_REQUEST, ResponseFactory.parseZod(err.message));
			break;
			// default status code is INTERNAL SERVER ERROR
			default:
				let statusCode = ResponseFactory.getStatus(err.constructor.name);
				if (statusCode)
					ret = new Response(statusCode, err.message);
				else{
					//console.log(err.constructor.name, err.stack);
					ret = new Response(StatusCodes.INTERNAL_SERVER_ERROR, err.message);
				}
			break;
		}
		return ret;
	}

	// create response object in case of success
	static getSuccessResponse(message : any, 
								status : StatusCodes = StatusCodes.OK) : Response{
		return new Response(status, message);
	}
}

// send a response object in case of success
export function successHandler(res : Res, message : any, 
								status : StatusCodes = StatusCodes.OK){
	// create success response object
	let response = ResponseFactory.getSuccessResponse(message, status);
    // send response status and message
	res.status(response.status).json(response.message);
}

export default ResponseFactory;