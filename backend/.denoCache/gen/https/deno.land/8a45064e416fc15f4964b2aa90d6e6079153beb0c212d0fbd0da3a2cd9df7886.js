import * as bcrypt from "./bcrypt/bcrypt.ts";
const context = self;
context.onmessage = (event) => {
    let data = event.data;
    switch (data.action) {
        case "hash": {
            context.postMessage(bcrypt.hashpw(data.payload.plaintext, data.payload.salt));
            break;
        }
        case "genSalt": {
            context.postMessage(bcrypt.gensalt(data.payload.log_rounds));
            break;
        }
        case "compare": {
            let result;
            try {
                result = bcrypt.checkpw(data.payload.plaintext, data.payload.hash);
            }
            catch {
                result = false;
            }
            context.postMessage(result);
            break;
        }
        default: {
            throw Error("Invalid data sent to worker");
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9iY3J5cHRAdjAuMi40L3NyYy93b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxvQkFBb0IsQ0FBQztBQUU3QyxNQUFNLE9BQU8sR0FBVyxJQUFXLENBQUM7QUFFcEMsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO0lBQzVCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDdEIsUUFBUSxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ25CLEtBQUssTUFBTSxDQUFDLENBQUM7WUFDWCxPQUFPLENBQUMsV0FBVyxDQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQ3pELENBQUM7WUFDRixNQUFNO1NBQ1A7UUFDRCxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBQ2QsT0FBTyxDQUFDLFdBQVcsQ0FDakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUN4QyxDQUFDO1lBQ0YsTUFBTTtTQUNQO1FBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQztZQUNkLElBQUksTUFBZSxDQUFDO1lBQ3BCLElBQUk7Z0JBQ0YsTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwRTtZQUFDLE1BQU07Z0JBQ04sTUFBTSxHQUFHLEtBQUssQ0FBQzthQUNoQjtZQUNELE9BQU8sQ0FBQyxXQUFXLENBQ2pCLE1BQU0sQ0FDUCxDQUFDO1lBQ0YsTUFBTTtTQUNQO1FBQ0QsT0FBTyxDQUFDLENBQUM7WUFDUCxNQUFNLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1NBQzVDO0tBQ0Y7QUFDSCxDQUFDLENBQUMifQ==