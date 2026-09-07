import authService from "../services/auth.service.js";

class AuthController {
  register = async (req, res, next) => {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next)=>{
    try {
      const result = await authService.login(req.body);
      
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  verifyEmail = async (req, res, next) => {
    try {
      await authService.verifyEmail(req.body.token || req.query.token);
      res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req, res, next) => {
    try {
      await authService.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        message: "If the account exists, a verification email has been sent",
      });
    } catch (error) {
      next(error);
    }
  };

}

export default new AuthController();
