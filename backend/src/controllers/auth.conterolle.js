

class authController {

     register = async(req,res,next) => {
        try {
            const userData = res.body;
            const result = await this.userService.register(userData)
        } catch (error) {
            
        }
    }
}