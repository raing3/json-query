import "mocha";
import { expect } from "chai";
import { parse } from "../../../lib/parser";


describe("parser", () => {
    it("should support uri-fragment", () => {
        const r = parse("#");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support uri-frament with trailing slash", () => {
        const r = parse("#/");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support root slash", () => {
        const r = parse("/");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support filters", () => {
        const r = parse("{.*}?id:!{^nr.*}");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support queries", () => {
        const r = parse("/prop/**/*?prop:0");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support patterns", () => {
        const r = parse("#((/a),(/b)(/c))+");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support patterns with whitespaces", () => {
        const r = parse("#( (/a), (/b)(/c) )+");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support patterns filters", () => {
        const r = parse("#( (/a), (/b)(/c) )+?id");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support typechecks", () => {
        const r = parse("#/a/b?:string");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });

    it("should support typechecks with lookahead", () => {
        const r = parse("#/a/b?:object?prop");
        expect(r).not.to.eq(null);
        expect(r.rest).to.eq("");
    });
});
