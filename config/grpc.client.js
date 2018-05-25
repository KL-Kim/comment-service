/**
 * gRPC client
 */
import grpc from 'grpc';

const BUSINESS_PROTO_PATH = __dirname + '/protos/business.proto';
const NOTIFICATION_PROTO_PATH = __dirname + '/protos/notification.proto';

export const businessProto = grpc.load(BUSINESS_PROTO_PATH).business;
export const notificationProto = grpc.load(NOTIFICATION_PROTO_PATH).notification;
