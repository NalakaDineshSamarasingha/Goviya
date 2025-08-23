import ballerina/http;
import ballerina/log;
import ballerina/random;
import ballerina/time;
import ballerina/regex;
import ballerinax/twilio;
import ballerinax/mongodb;

configurable string apiKey = ?;
configurable string apiSecret = ?;
configurable string accountSid = ?;
configurable string twilioPhoneNumber = ?;
configurable string mongoUser = ?;
configurable string mongoPass = ?;
configurable string mongoCluster = ?;

twilio:ConnectionConfig twilioConfig = {
    auth: {
        apiKey,
        apiSecret,
        accountSid
    }
};

final twilio:Client twilioClient = check new (twilioConfig);

final mongodb:Client mongoDb = check new ({
    connection: string `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/?retryWrites=true&w=majority`
});

// Data types
type SendOtpRequest record {
    string phoneNumber;
    string purpose?; // "signup", "login", "verification" - default to "verification"
};

type OtpRecord record {
    string id?;
    string phoneNumber;
    string otp;
    string purpose;
    time:Utc expiresAt;
    time:Utc createdAt;
    boolean isUsed;
};

type ApiResponse record {
    boolean success;
    string message;
    json data?;
};

// Utility functions
function generateOtp() returns string|error {
    int otpNum = check random:createIntInRange(100000, 999999);
    return otpNum.toString();
}

function isValidSriLankanPhone(string phone) returns boolean {
    string phonePattern = "^(\\+94|0)?[7][0-8][0-9]{7}$";
    return regex:matches(phone, phonePattern);
}

function formatSriLankanPhone(string phone) returns string {
    // Convert to international format +94xxxxxxxxx
    if (phone.startsWith("+94")) {
        return phone;
    } else if (phone.startsWith("0")) {
        return "+94" + phone.substring(1);
    } else {
        return "+94" + phone;
    }
}

public function sendotp(http:Request req) returns http:Response|error {
    http:Response response = new;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Content-Type", "application/json");
    
    // Parse request body
    json|error requestBody = req.getJsonPayload();
    if (requestBody is error) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid request body. Expected JSON format."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Convert JSON to SendOtpRequest
    SendOtpRequest|error otpRequest = requestBody.cloneWithType(SendOtpRequest);
    if (otpRequest is error) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid request format. Required field: phoneNumber"
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Validate Sri Lankan phone number
    if (!isValidSriLankanPhone(otpRequest.phoneNumber)) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid Sri Lankan mobile number format. Use 0xxxxxxxxx or +94xxxxxxxxx"
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    string formattedPhone = formatSriLankanPhone(otpRequest.phoneNumber);
    string purpose = otpRequest.purpose ?: "verification";
    
    // Generate OTP
    string|error otpResult = generateOtp();
    if (otpResult is error) {
        log:printError("Failed to generate OTP", 'error = otpResult);
        response.statusCode = 500;
        json apiResponse = {
            "success": false,
            "message": "Failed to generate OTP. Please try again."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    string otp = otpResult;
    
    // Set expiry time (5 minutes from now)
    time:Utc currentTime = time:utcNow();
    time:Utc expiryTime = time:utcAddSeconds(currentTime, 300);
    
    // Store OTP in database
    mongodb:Database goviyaDb = check mongoDb->getDatabase("goviya");
    mongodb:Collection otpCollection = check goviyaDb->getCollection("otps");
    
    // Delete any existing OTPs for this phone number and purpose
    map<json> deleteQuery = {
        "phoneNumber": formattedPhone,
        "purpose": purpose,
        "isUsed": false
    };
    _ = check otpCollection->deleteMany(deleteQuery);
    
    // Insert new OTP record
    OtpRecord otpRecord = {
        phoneNumber: formattedPhone,
        otp: otp,
        purpose: purpose,
        expiresAt: expiryTime,
        createdAt: currentTime,
        isUsed: false
    };
    
    error? insertResult = otpCollection->insertOne(otpRecord);
    if (insertResult is error) {
        log:printError("Failed to store OTP in database", 'error = insertResult);
        response.statusCode = 500;
        json apiResponse = {
            "success": false,
            "message": "Failed to store OTP. Please try again."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Send SMS via Twilio
    string message = string `Your GOVIYA verification code is: ${otp}. This code will expire in 5 minutes. Do not share this code with anyone.`;
    
    twilio:CreateMessageRequest twilioRequest = {
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: message
    };
    
    twilio:Message|error twilioResponse = twilioClient->createMessage(twilioRequest);
    
    if (twilioResponse is error) {
        log:printError("Failed to send SMS via Twilio", 'error = twilioResponse);
        response.statusCode = 500;
        json apiResponse = {
            "success": false,
            "message": "Failed to send SMS. Please check your phone number and try again."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Log success (for development - remove OTP from logs in production)
    log:printInfo(string `OTP sent successfully to ${formattedPhone}. OTP: ${otp} (DEV ONLY)`);
    
    // Return success response
    response.statusCode = 200;
    json apiResponse = {
        "success": true,
        "message": "OTP sent successfully to your mobile number",
        "data": {
            "phoneNumber": formattedPhone,
            "purpose": purpose,
            "expiresIn": "5 minutes"
        }
    };
    response.setJsonPayload(apiResponse);
    return response;
}

// Verify OTP function
type VerifyOtpRequest record {
    string phoneNumber;
    string otp;
    string purpose?;
};

public function verifyOtp(http:Request req) returns http:Response|error {
    http:Response response = new;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Content-Type", "application/json");
    
    // Parse request body
    json|error requestBody = req.getJsonPayload();
    if (requestBody is error) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid request body. Expected JSON format."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Convert JSON to VerifyOtpRequest
    VerifyOtpRequest|error verifyRequest = requestBody.cloneWithType(VerifyOtpRequest);
    if (verifyRequest is error) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid request format. Required fields: phoneNumber, otp"
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    string formattedPhone = formatSriLankanPhone(verifyRequest.phoneNumber);
    string purpose = verifyRequest.purpose ?: "verification";
    
    // Find OTP in database
    mongodb:Database goviyaDb = check mongoDb->getDatabase("goviya");
    mongodb:Collection otpCollection = check goviyaDb->getCollection("otps");
    
    map<json> query = {
        "phoneNumber": formattedPhone,
        "otp": verifyRequest.otp,
        "purpose": purpose,
        "isUsed": false,
        "expiresAt": {"$gt": time:utcNow()}
    };
    
    stream<OtpRecord, error?> otpStream = check otpCollection->find(query);
    OtpRecord[] otps = check from OtpRecord otpRec in otpStream select otpRec;
    
    if (otps.length() == 0) {
        response.statusCode = 400;
        json apiResponse = {
            "success": false,
            "message": "Invalid or expired OTP. Please request a new OTP."
        };
        response.setJsonPayload(apiResponse);
        return response;
    }
    
    // Mark OTP as used
    map<json> updateQuery = {"_id": otps[0].id};
    mongodb:Update updateData = {"$set": {"isUsed": true}};
    
    mongodb:UpdateResult|error updateResult = otpCollection->updateOne(updateQuery, updateData);
    if (updateResult is error) {
        log:printError("Failed to mark OTP as used", 'error = updateResult);
    }
    
    log:printInfo(string `OTP verified successfully for ${formattedPhone}`);
    
    // Return success response
    response.statusCode = 200;
    json apiResponse = {
        "success": true,
        "message": "OTP verified successfully",
        "data": {
            "phoneNumber": formattedPhone,
            "verified": true,
            "purpose": purpose
        }
    };
    response.setJsonPayload(apiResponse);
    return response;
}