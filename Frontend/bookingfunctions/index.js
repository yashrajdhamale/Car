
const { sendAirportInvoice }       = require("./airportTransfer");
const { sendOutstationInvoice }    = require("./outstationInvoice");
const { sendHolidayInvoice }       = require("./Sendholidayinvoice");
const { sendLocalPickupInvoice }   = require("./sendLocalPickupInvoice"); // ← NEW
const { generateRideOtp, verifyRideOtp } = require("./otpRide");
const {
  searchPlaces,
  calculateDistance,
  debugMapMyIndia,
  testDistanceWithELoc,
  reverseGeocode,
  resolveELoc,
  getNearbyDrivers,
  createLocalPickupRide,
  acceptLocalRide
} = require("./mapmyindia");

exports.sendAirportInvoice      = sendAirportInvoice;
exports.sendOutstationInvoice   = sendOutstationInvoice;
exports.sendHolidayInvoice      = sendHolidayInvoice;
exports.sendLocalPickupInvoice  = sendLocalPickupInvoice; // ← NEW
exports.generateRideOtp         = generateRideOtp;
exports.verifyRideOtp           = verifyRideOtp;
exports.searchPlaces            = searchPlaces;
exports.calculateDistance       = calculateDistance;
exports.debugMapMyIndia         = debugMapMyIndia;
exports.testDistanceWithELoc    = testDistanceWithELoc;
exports.reverseGeocode          = reverseGeocode;
exports.resolveELoc             = resolveELoc;
exports.getNearbyDrivers        = getNearbyDrivers;
exports.createLocalPickupRide   = createLocalPickupRide;
exports.acceptLocalRide         = acceptLocalRide;
