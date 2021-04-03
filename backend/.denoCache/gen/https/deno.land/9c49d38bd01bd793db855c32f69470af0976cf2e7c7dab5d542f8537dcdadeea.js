import { Oid } from "./oid.ts";
import { Format } from "../connection/connection.ts";
import { decodeBigint, decodeBigintArray, decodeBoolean, decodeBooleanArray, decodeBox, decodeBoxArray, decodeBytea, decodeByteaArray, decodeCircle, decodeCircleArray, decodeDate, decodeDateArray, decodeDatetime, decodeDatetimeArray, decodeInt, decodeIntArray, decodeJson, decodeJsonArray, decodeLine, decodeLineArray, decodeLineSegment, decodeLineSegmentArray, decodePath, decodePathArray, decodePoint, decodePointArray, decodePolygon, decodePolygonArray, decodeStringArray, decodeTid, decodeTidArray, } from "./decoders.ts";
const decoder = new TextDecoder();
function decodeBinary() {
    throw new Error("Not implemented!");
}
function decodeText(value, typeOid) {
    const strValue = decoder.decode(value);
    switch (typeOid) {
        case Oid.bpchar:
        case Oid.char:
        case Oid.cidr:
        case Oid.float4:
        case Oid.float8:
        case Oid.inet:
        case Oid.macaddr:
        case Oid.name:
        case Oid.numeric:
        case Oid.oid:
        case Oid.regclass:
        case Oid.regconfig:
        case Oid.regdictionary:
        case Oid.regnamespace:
        case Oid.regoper:
        case Oid.regoperator:
        case Oid.regproc:
        case Oid.regprocedure:
        case Oid.regrole:
        case Oid.regtype:
        case Oid.text:
        case Oid.time:
        case Oid.timetz:
        case Oid.uuid:
        case Oid.varchar:
        case Oid.void:
            return strValue;
        case Oid.bpchar_array:
        case Oid.char_array:
        case Oid.cidr_array:
        case Oid.float4_array:
        case Oid.float8_array:
        case Oid.inet_array:
        case Oid.macaddr_array:
        case Oid.name_array:
        case Oid.numeric_array:
        case Oid.oid_array:
        case Oid.regclass_array:
        case Oid.regconfig_array:
        case Oid.regdictionary_array:
        case Oid.regnamespace_array:
        case Oid.regoper_array:
        case Oid.regoperator_array:
        case Oid.regproc_array:
        case Oid.regprocedure_array:
        case Oid.regrole_array:
        case Oid.regtype_array:
        case Oid.text_array:
        case Oid.time_array:
        case Oid.timetz_array:
        case Oid.uuid_varchar:
        case Oid.varchar_array:
            return decodeStringArray(strValue);
        case Oid.int2:
        case Oid.int4:
        case Oid.xid:
            return decodeInt(strValue);
        case Oid.int2_array:
        case Oid.int4_array:
        case Oid.xid_array:
            return decodeIntArray(strValue);
        case Oid.bool:
            return decodeBoolean(strValue);
        case Oid.bool_array:
            return decodeBooleanArray(strValue);
        case Oid.box:
            return decodeBox(strValue);
        case Oid.box_array:
            return decodeBoxArray(strValue);
        case Oid.circle:
            return decodeCircle(strValue);
        case Oid.circle_array:
            return decodeCircleArray(strValue);
        case Oid.bytea:
            return decodeBytea(strValue);
        case Oid.byte_array:
            return decodeByteaArray(strValue);
        case Oid.date:
            return decodeDate(strValue);
        case Oid.date_array:
            return decodeDateArray(strValue);
        case Oid.int8:
            return decodeBigint(strValue);
        case Oid.int8_array:
            return decodeBigintArray(strValue);
        case Oid.json:
        case Oid.jsonb:
            return decodeJson(strValue);
        case Oid.json_array:
        case Oid.jsonb_array:
            return decodeJsonArray(strValue);
        case Oid.line:
            return decodeLine(strValue);
        case Oid.line_array:
            return decodeLineArray(strValue);
        case Oid.lseg:
            return decodeLineSegment(strValue);
        case Oid.lseg_array:
            return decodeLineSegmentArray(strValue);
        case Oid.path:
            return decodePath(strValue);
        case Oid.path_array:
            return decodePathArray(strValue);
        case Oid.point:
            return decodePoint(strValue);
        case Oid.point_array:
            return decodePointArray(strValue);
        case Oid.polygon:
            return decodePolygon(strValue);
        case Oid.polygon_array:
            return decodePolygonArray(strValue);
        case Oid.tid:
            return decodeTid(strValue);
        case Oid.tid_array:
            return decodeTidArray(strValue);
        case Oid.timestamp:
        case Oid.timestamptz:
            return decodeDatetime(strValue);
        case Oid.timestamp_array:
        case Oid.timestamptz_array:
            return decodeDatetimeArray(strValue);
        default:
            return strValue;
    }
}
export function decode(value, column) {
    if (column.format === Format.BINARY) {
        return decodeBinary();
    }
    else if (column.format === Format.TEXT) {
        return decodeText(value, column.typeOid);
    }
    else {
        throw new Error(`Unknown column format: ${column.format}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVjb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFVLE1BQU0sRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFDTCxZQUFZLEVBQ1osaUJBQWlCLEVBQ2pCLGFBQWEsRUFDYixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULGNBQWMsRUFDZCxXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixpQkFBaUIsRUFDakIsVUFBVSxFQUNWLGVBQWUsRUFDZixjQUFjLEVBQ2QsbUJBQW1CLEVBQ25CLFNBQVMsRUFDVCxjQUFjLEVBQ2QsVUFBVSxFQUNWLGVBQWUsRUFDZixVQUFVLEVBQ1YsZUFBZSxFQUNmLGlCQUFpQixFQUNqQixzQkFBc0IsRUFDdEIsVUFBVSxFQUNWLGVBQWUsRUFDZixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLGFBQWEsRUFDYixrQkFBa0IsRUFDbEIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxjQUFjLEdBQ2YsTUFBTSxlQUFlLENBQUM7QUFFdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUVsQyxTQUFTLFlBQVk7SUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFHRCxTQUFTLFVBQVUsQ0FBQyxLQUFpQixFQUFFLE9BQWU7SUFDcEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV2QyxRQUFRLE9BQU8sRUFBRTtRQUNmLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUNoQixLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDaEIs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