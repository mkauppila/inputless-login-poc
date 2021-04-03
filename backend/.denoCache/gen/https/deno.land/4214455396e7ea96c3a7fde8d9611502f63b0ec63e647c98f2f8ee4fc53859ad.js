function defaultValue(value) {
    return value;
}
export function parseArray(source, transform = defaultValue) {
    return new ArrayParser(source, transform).parse();
}
class ArrayParser {
    constructor(source, transform) {
        this.source = source;
        this.transform = transform;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
    }
    isEof() {
        return this.position >= this.source.length;
    }
    nextCharacter() {
        const character = this.source[this.position++];
        if (character === "\\") {
            return {
                value: this.source[this.position++],
                escaped: true,
            };
        }
        return {
            value: character,
            escaped: false,
        };
    }
    record(character) {
        this.recorded.push(character);
    }
    newEntry(includeEmpty = false) {
        let entry;
        if (this.recorded.length > 0 || includeEmpty) {
            entry = this.recorded.join("");
            if (entry === "NULL" && !includeEmpty) {
                entry = null;
            }
            if (entry !== null)
                entry = this.transform(entry);
            this.entries.push(entry);
            this.recorded = [];
        }
    }
    consumeDimensions() {
        if (this.source[0] === "[") {
            while (!this.isEof()) {
                const char = this.nextCharacter();
                if (char.value === "=")
                    break;
            }
        }
    }
    getSeparator() {
        if (/;(?![^(]*\))/.test(this.source.substr(1, this.source.length - 1))) {
            return ";";
        }
        return ",";
    }
    parse(nested = false) {
        const separator = this.getSeparator();
        let character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
            character = this.nextCharacter();
            if (character.value === "{" && !quote) {
                this.dimension++;
                if (this.dimension > 1) {
                    parser = new ArrayParser(this.source.substr(this.position - 1), this.transform);
                    this.entries.push(parser.parse(true));
                    this.position += parser.position - 2;
                }
            }
            else if (character.value === "}" && !quote) {
                this.dimension--;
                if (!this.dimension) {
                    this.newEntry();
                    if (nested)
                        return this.entries;
                }
            }
            else if (character.value === '"' && !character.escaped) {
                if (quote)
                    this.newEntry(true);
                quote = !quote;
            }
            else if (character.value === separator && !quote) {
                this.newEntry();
            }
            else {
                this.record(character.value);
            }
        }
        if (this.dimension !== 0) {
            throw new Error("array dimension not balanced");
        }
        return this.entries;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlfcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJyYXlfcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLFNBQVMsWUFBWSxDQUFDLEtBQWE7SUFDakMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBT0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFjLEVBQUUsU0FBUyxHQUFHLFlBQVk7SUFDakUsT0FBTyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sV0FBVztJQU1mLFlBQ1MsTUFBYyxFQUNkLFNBQXlCO1FBRHpCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxjQUFTLEdBQVQsU0FBUyxDQUFnQjtRQVBsQyxhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFDN0IsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUN4QixjQUFTLEdBQUcsQ0FBQyxDQUFDO0lBS1gsQ0FBQztJQUVKLEtBQUs7UUFDSCxPQUFPLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDN0MsQ0FBQztJQUVELGFBQWE7UUFDWCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixPQUFPO2dCQUNMLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxFQUFFLElBQUk7YUFDZCxDQUFDO1NBQ0g7UUFDRCxPQUFPO1lBQ0wsS0FBSyxFQUFFLFNBQVM7WUFDaEIsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sQ0FBQyxTQUFpQjtRQUN0QixJQUFJ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