import {StatusCodes} from 'http-status-codes';
import { Response as Res } from 'express'

class Response {
	status : number;
	message : {};

	constructor(status : number, message : string | { [key:string] : string } ){
		this.status = status;
		if ( typeof message === 'string')
			this.message = 	{ "message" : message };
		else this.message = message;
	}
	
}

class ResponseFactory{

	static getErrResponse(err : Error){
		let ret : Response | null = null;
		
		switch(err.constructor.name){
			case "MissingToken":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "JsonWebTokenError":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "TokenExpiredError":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "NotBeforeError":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "LoginFailed":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "MismatchedUser":
				ret = new Response(StatusCodes.FORBIDDEN, err.message);
			break;
			case "MismatchedDatasetOwner":
				ret = new Response(StatusCodes.FORBIDDEN, err.message);
			break;
			case "RestrictedToAdmin":
				ret = new Response(StatusCodes.FORBIDDEN, err.message);
			break;
			case "DatabaseError":
				ret = new Response(StatusCodes.FORBIDDEN, "database error");
			break;
			case "ZodError":
				ret = new Response(StatusCodes.BAD_REQUEST, "bad request");
			break;
			case "DatasetNotValid":
				ret = new Response(StatusCodes.BAD_REQUEST, err.message);
			break;
			case "DatasetNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "UserNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "ModelNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			default:
				console.log(err.constructor.name, err.stack);
				ret = new Response(StatusCodes.INTERNAL_SERVER_ERROR, err.message);
			break;
		}
		return ret;
	}

	static getSuccessResponse(message : string | { [key:string] : string }, 
								status : number = StatusCodes.OK) : Response{
		return new Response(status, message);
	}
}

export function successHandler(res : Res, message : string | { [key:string] : string }, 
								status : number = StatusCodes.OK){
	let response = ResponseFactory.getSuccessResponse(message, status);
    res.status(response.status).send(response.message);
}

export default ResponseFactory;