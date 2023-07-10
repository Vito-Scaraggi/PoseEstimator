import {StatusCodes} from 'http-status-codes';
import { Response as Res } from 'express'

class Response {
	status : number;
	message : {};

	constructor(status : number, message : any ){
		this.status = status;
		switch(typeof message){
			case 'undefined':
				this.message = 	{ "message" : "unknown" };
			break;
			case 'string':
				this.message = 	{ "message" : message };
			break;
			default:
				this.message = JSON.parse(JSON.stringify(message));
			break;
		}
	}

}

class ResponseFactory{

	static parseZod(message : string){
		const errObj = JSON.parse(message);
		return {
			"message" : "bad request",
			"validation" : errObj.map( (elem:any) => elem.message).
										filter( (elem:any) => elem !== undefined )
		}
	}

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
				ret = new Response(StatusCodes.INTERNAL_SERVER_ERROR, "database error");
			break;
			case "ZodError":
				ret = new Response(StatusCodes.BAD_REQUEST, ResponseFactory.parseZod(err.message));
			break;
			case "DatasetNotValid":
				ret = new Response(StatusCodes.BAD_REQUEST, err.message);
			break;
			case "DatasetNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "InvalidFile":
				ret = new Response(StatusCodes.BAD_REQUEST, err.message);
			break;
			case "FileNotFoundError":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "UserNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "ModelNotFound":
				ret = new Response(StatusCodes.NOT_FOUND, err.message);
			break;
			case "CreditsTerminated":
				ret = new Response(StatusCodes.UNAUTHORIZED, err.message);
			break;
			case "ExtensionNotMatched":
				ret = new Response(StatusCodes.BAD_REQUEST, err.message);
			break;
			default:
				console.log(err.constructor.name, err.stack);
				ret = new Response(StatusCodes.INTERNAL_SERVER_ERROR, err.message);
			break;
		}
		return ret;
	}

	static getSuccessResponse(message : any, 
								status : number = StatusCodes.OK) : Response{
		return new Response(status, message);
	}
}

export function successHandler(res : Res, message : any, 
								status : number = StatusCodes.OK){
	
	let response = ResponseFactory.getSuccessResponse(message, status);
    res.status(response.status).send(response.message);
}

export default ResponseFactory;