/**
 * Business gRPC client
 */
import grpc from 'grpc';

const PROTO_PATH = __dirname + '/protos/business.proto';
const businessProto = grpc.load(PROTO_PATH).business;

export default businessProto;
