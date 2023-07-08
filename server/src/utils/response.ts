import {StatusCodes} from 'http-status-codes';

class Response {
	status : number;
	message : { "message" : string };

	constructor(status : number, message : { "message" : string } ){
		this.status = status;
		this.message = message;
	}
	
}

class ResponseFactory{

	static ErrorToStatusCode : { [key:string] : StatusCodes }= {
		"MissingToken" : StatusCodes.UNAUTHORIZED,
		"JsonWebTokenError" : StatusCodes.UNAUTHORIZED,
		"TokenExpiredError" : StatusCodes.UNAUTHORIZED,
		"NotBeforeError" : StatusCodes.UNAUTHORIZED,
		"DatasetNotFound": StatusCodes.BAD_REQUEST,
		"DatasetNotValid": StatusCodes.BAD_REQUEST
	}

	static getErrResponse(err : Error) : Response{
		//let status = this.ErrorToStatusCode[err.constructor.name];
		let statusCode = ResponseFactory.ErrorToStatusCode[err.constructor.name] || StatusCodes.INTERNAL_SERVER_ERROR;
		return new Response(  statusCode,
							{ "message" : err.message } );
	}

	static getOKResponse(status = StatusCodes.OK, message = "success") : Response{
		return new Response(status, { "message" : message } );
	}
}

export default ResponseFactory;