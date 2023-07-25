import { Vertex } from "./vertex";



export interface Projection extends Vertex {
   date: Date,
   daysOut: number,
   futureDateId: string;
   inventoryEndingOnHand: number;
   supplyInTransit: number;
   supplyPlanned: number;
   inventoryBeginningOnHand: number;
   demandPlanned: number;
   dateGenerated: Date;
}

export interface RawProjection extends Vertex {
    futureDate: {
        id: string,
        date: Date,
        daysOut: number
    },
    projection: {
        id: string,
        inventoryEndingOnHand: number,
        supplyInTransit: number,
        supplyPlanned: number,
        inventoryBeginningOnHand: number,
        demandPlanned: number,
        dateGenerated: Date
    }
 }