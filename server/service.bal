import ballerina/http;
import ballerinax/mongodb;


configurable string mongoUser = ?;
configurable string mongoPass = ?;
configurable string mongoCluster = ?;

mongodb:Client mongoDb = check new ({
    connection: string `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/?retryWrites=true&w=majority`
});


service / on new http:Listener(9090) {
    resource function get .() returns json|error {
    }
}
