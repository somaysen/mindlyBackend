
import userService from "../services/user.service.js";

class UserController {

    postUserInfo = async(req, res, next) =>{
        try {
            const data = await userService.createUser({
                ...req.body,
                auth: req.user.sub,
            });

            res.status(201).json({
                success: true,
                data: data,
            })
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
