
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.success = false;
    if(error){
      console.log(error,error.message);
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;