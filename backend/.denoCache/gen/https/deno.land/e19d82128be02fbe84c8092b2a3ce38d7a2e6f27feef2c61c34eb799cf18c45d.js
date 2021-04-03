export class PostgresError extends Error {
    constructor(fields) {
        super(fields.message);
        this.fields = fields;
        this.name = "PostgresError";
    }
}
export function parseError(msg) {
    return new PostgresError(parseWarning(msg));
}
export function parseNotice(msg) {
    return parseWarning(msg);
}
function parseWarning(msg) {
    const errorFields = {};
    let byte;
    let char;
    let errorMsg;
    while ((byte = msg.reader.readByte())) {
        char = String.fromCharCode(byte);
        errorMsg = msg.reader.readCString();
        switch (char) {
            case "S":
                errorFields.severity = errorMsg;
                break;
            case "C":
                errorFields.code = errorMsg;
                break;
            case "M":
                errorFields.message = errorMsg;
                break;
            case "D":
                errorFields.detail = errorMsg;
                break;
            case "H":
                errorFields.hint = errorMsg;
                break;
            case "P":
                errorFields.position = errorMsg;
                break;
            case "p":
                errorFields.internalPosition = errorMsg;
                break;
            case "q":
                errorFields.internalQuery = errorMsg;
                break;
            case "W":
                errorFields.where = errorMsg;
                break;
            case "s":
                errorFields.schema = errorMsg;
                break;
            case "t":
                errorFields.table = errorMsg;
                break;
            case "c":
                errorFields.column = errorMsg;
                break;
            case "d":
                errorFields.dataTypeName = errorMsg;
                break;
            case "n":
                errorFields.constraint = errorMsg;
                break;
            case "F":
                errorFields.file = errorMsg;
                break;
            case "L":
                errorFields.line = errorMsg;
                break;
            case "R":
                errorFields.routine = errorMsg;
                break;
            default:
                break;
        }
    }
    return errorFields;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBc0JBLE1BQU0sT0FBTyxhQUFjLFNBQVEsS0FBSztJQUd0QyxZQUFZLE1BQXFCO1FBQy9CLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxlQUFlLENBQUM7SUFDOUIsQ0FBQztDQUNGO0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxHQUFZO0lBQ3JDLE9BQU8sSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBWTtJQUN0QyxPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBS0QsU0FBUyxZQUFZLENBQUMsR0FBWTtJQUdoQyxNQUFNLFdBQVcsR0FBUSxFQUFFLENBQUM7SUFFNUIsSUFBSSxJQUFZLENBQUM7SUFDakIsSUFBSSxJQUFZLENBQUM7SUFDakIsSUFBSSxRQUFnQixDQUFDO0lBRXJCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFO1FBQ3JDLElBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXBDLFFBQVEsSUFBSSxFQUFFO1lBQ1osS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUNoQyxNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO2dCQUM1QixNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO2dCQUMvQixNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO2dCQUM5QixNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO2dCQUM1QixNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUNoQyxNQUFNO1lBQ1IsS0FBSyxHQUFHO2dCQUNOLFdBQVcsQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7Z0JBQ3hDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7Z0JBQ3JDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQzdCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7Z0JBQzlCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQzdCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7Z0JBQzlCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7Z0JBQ3BDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7Z0JBQ2xDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBQzVCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBQzVCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7Z0JBQy9CLE1BQU07WUFDUjtnQkFJRSxNQUFNO1NBQ1Q7S0FDRjtJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMifQ==