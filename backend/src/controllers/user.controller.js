
import userService from "../services/user.service.js";
import Auth from "../models/auth.model.js";

class UserController {

    postUserInfo = async(req, res, next) =>{
        try {
            const data = await userService.createUser({
                ...req.body,
                auth: req.user,
            });

            if(!userExit){
                await Auth.findOne(req.user);
            }

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
