import ballerina/http;
import ballerina/time;
import ballerinax/mongodb;
import server.auth;

configurable string mongoUser = ?;
configurable string mongoPass = ?;
configurable string mongoCluster = ?;

final mongodb:Client mongoDb = check new ({
    connection: string `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/?retryWrites=true&w=majority`
});

// Data types
type User record {
    string id?;
    string phoneNumber;
    string firstName;
    string lastName;
    string name;
    string email;
    time:Utc createdAt;
    time:Utc updatedAt;
};

type CheckUserRequest record {
    string phoneNumber;
};

type RegisterUserRequest record {
    string phoneNumber;
    string firstName;
    string lastName;
    string name;
    string email;
};

service / on new http:Listener(9090) {
    resource function options .(http:Request req) returns http:Response {
        http:Response res = new;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res;
    }

    // Send OTP endpoint
    resource function post sendOtp(http:Request req) returns http:Response|error {
        return auth:sendotp(req);
    }

    // Verify OTP endpoint  
    resource function post verifyOtp(http:Request req) returns http:Response|error {
        return auth:verifyOtp(req);
    }

    // Check if user exists endpoint
    resource function post checkUser(http:Request req) returns http:Response|error {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Content-Type", "application/json");

        json|error requestBody = req.getJsonPayload();
        if (requestBody is error) {
            response.statusCode = 400;
            json apiResponse = {
                "success": false,
                "message": "Invalid request body"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        CheckUserRequest|error checkRequest = requestBody.cloneWithType(CheckUserRequest);
        if (checkRequest is error) {
            response.statusCode = 400;
            json apiResponse = {
                "success": false,
                "message": "Invalid request format"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        mongodb:Database goviyaDb = check mongoDb->getDatabase("goviya");
        mongodb:Collection usersCollection = check goviyaDb->getCollection("users");

        map<json> query = {"phoneNumber": checkRequest.phoneNumber};
        stream<User, error?> userStream = check usersCollection->find(query);
        User[] users = check from User user in userStream select user;

        response.statusCode = 200;
        json apiResponse = {
            "success": true,
            "message": users.length() > 0 ? "User exists" : "User not found",
            "data": {
                "exists": users.length() > 0,
                "user": users.length() > 0 ? users[0].toJson() : null
            }
        };
        response.setJsonPayload(apiResponse);
        return response;
    }

    // Register new user endpoint
    resource function post registerUser(http:Request req) returns http:Response|error {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Content-Type", "application/json");

        json|error requestBody = req.getJsonPayload();
        if (requestBody is error) {
            response.statusCode = 400;
            json apiResponse = {
                "success": false,
                "message": "Invalid request body"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        RegisterUserRequest|error registerRequest = requestBody.cloneWithType(RegisterUserRequest);
        if (registerRequest is error) {
            response.statusCode = 400;
            json apiResponse = {
                "success": false,
                "message": "Invalid request format"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        mongodb:Database goviyaDb = check mongoDb->getDatabase("goviya");
        mongodb:Collection usersCollection = check goviyaDb->getCollection("users");

        // Check if user already exists
        map<json> existingUserQuery = {"phoneNumber": registerRequest.phoneNumber};
        stream<User, error?> existingUserStream = check usersCollection->find(existingUserQuery);
        User[] existingUsers = check from User user in existingUserStream select user;

        if (existingUsers.length() > 0) {
            response.statusCode = 400;
            json apiResponse = {
                "success": false,
                "message": "User already exists with this phone number"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        // Create new user
        time:Utc currentTime = time:utcNow();
        User newUser = {
            phoneNumber: registerRequest.phoneNumber,
            firstName: registerRequest.firstName,
            lastName: registerRequest.lastName,
            name: registerRequest.name,
            email: registerRequest.email,
            createdAt: currentTime,
            updatedAt: currentTime
        };

        error? insertResult = usersCollection->insertOne(newUser);
        if (insertResult is error) {
            response.statusCode = 500;
            json apiResponse = {
                "success": false,
                "message": "Failed to create user account"
            };
            response.setJsonPayload(apiResponse);
            return response;
        }

        response.statusCode = 201;
        json apiResponse = {
            "success": true,
            "message": "User registered successfully",
            "data": {
                "user": newUser.toJson()
            }
        };
        response.setJsonPayload(apiResponse);
        return response;
    }

    // Health check endpoint
    resource function get health() returns json {
        return {
            "status": "OK",
            "message": "GOVIYA API is running",
            "timestamp": time:utcNow()
        };
    }
}
