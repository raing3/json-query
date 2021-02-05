import "mocha";
import { expect } from "chai";
import { select } from "../../../lib/interpreter/nodes";
import { parse, reduce } from "../../../lib/parser";
import get from "../../../lib/get";

const expr = select.expression;


describe("expression", () => {
    function ast(queryString) {
        const data = reduce(parse(`*?${queryString}`));
        const expressions = get(data, "**?type:expression");
        expect(expressions.length).to.eq(1, `expected helper-method to extract '${queryString}' from ast`);
        return expressions[0];
    }

    it("should parse expression", () => {
        const result = ast("type:var");
        expect(result.type).to.eq("expression");
    });

    it("should return undefined if query fails", () => {
        const result = expr(ast("type:var"), [{}]);
        expect(result).to.be.undefined;
    });

    it("should return undefined for non-objects", () => {
        const result = expr(ast("type:undefined"), [1]);
        expect(result).to.be.undefined;
    });

    it("should return undefined if no data is given", () => {
        const result = expr(ast("type:undefined"), [null]);
        expect(result).to.be.undefined;
    });

    it("should return entry if query has matches", () => {
        const result = expr(ast("type:true"), [{ type: true }]);
        expect(result).to.deep.eq([{ type: true }]);
    });

    it("should match booleans", () => {
        const result = expr(ast("type:false"), [{ type: false }]);
        expect(result).to.deep.eq([{ type: false }]);
    });

    it("should test for null", () => {
        const result = expr(ast("type:null"), [{ type: null }]);
        expect(result).to.deep.eq([{ type: null }]);
    });

    it("should fail on negated comparison", () => {
        const result = expr(ast("type:!true"), [{ type: true }]);
        expect(result).to.be.undefined;
    });

    it("should validate undefined", () => {
        const result = expr(ast("init:undefined"), [{}]);
        expect(result).to.deep.equal([{}]);
    });

    describe("regex", () => {

        it("should support regex-tests", () => {
            const result = expr(ast("value:{input$}"), [{ value: "any input" }]);
            expect(result).to.deep.equal([{ value: "any input" }]);
        });

        it("should negate regex-tests", () => {
            const result = expr(ast("value:!{input$}"), [{ value: "any input" }]);
            expect(result).to.be.undefined;
        });

        it("should positively negate regex-tests", () => {
            const result = expr(ast("value:!{input$}"), [{ value: "any output" }]);
            expect(result).to.deep.equal([{ value: "any output" }]);
        });
    });
});

