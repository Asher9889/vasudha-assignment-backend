// {
//   _id: ObjectId,

//   title: string,

//   domain: "CLIMATE" | "ENERGY" | "POWER",

//   visualizationType:
//     "GEO_MAP"
//     | "STATE_HEATMAP"
//     | "LINE"
//     | "BAR"
//     | "AREA",

//   uploadedBy: ObjectId,

//   status:
//     "PENDING"
//     | "APPROVED"
//     | "REJECTED",

//   rejectionReason?: string,

//   file: {
//     originalName: string,
//     url: string,
//     mimeType: string,
//     size: number
//   },

//   schema: {
//     columns: [
//       {
//         name: string,
//         type: "STRING" | "NUMBER" | "DATE"
//       }
//     ]
//   },

//   visualizationConfig: {
//     latitudeColumn?: string,
//     longitudeColumn?: string,
//     stateColumn?: string,
//     xAxisColumn?: string,
//     valueColumn?: string
//   },

//   approvedBy?: ObjectId,
//   approvedAt?: Date,

//   publishedAt?: Date,
//   publishedOrder?: number,

//   createdAt: Date,
//   updatedAt: Date
// }