import metvaldData from "../../smartwallet/data.json";
import meteoraidnData from "../../smartwallet/meteoraidn.json";

const formattedMetvald = metvaldData.map((item) => ({
    ...item,
    source: "metvald",
}));

const formattedMeteoraidn = meteoraidnData.map((item) => ({
    ...item,
    source: "meteoraidn-discord",
}));

export default [...formattedMetvald, ...formattedMeteoraidn];