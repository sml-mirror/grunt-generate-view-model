import { ComplexInterface } from "./complexContextParam";

export const asyncTransformer = async(modelParam2: any, contextParam: ComplexInterface) => {
    return null;
};

export const notAsyncTransformer = (modelParam: any, contextParam: string ) => {return null; };

export async function asyncTransformer2 () { console.log("async"); }