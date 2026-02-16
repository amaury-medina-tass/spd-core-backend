import { ResponseInterceptor } from '../../../apps/spd-core-api/src/common/interceptors/response.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { Reflector } from '@nestjs/core';

describe('ResponseInterceptor', () => {
    let interceptor: ResponseInterceptor<any>;
    let mockReflector: Partial<Reflector>;
    let mockContext: Partial<ExecutionContext>;
    let mockCallHandler: Partial<CallHandler>;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockReflector = {
            getAllAndOverride: jest.fn().mockReturnValue(undefined),
        };
        interceptor = new ResponseInterceptor(mockReflector as Reflector);

        mockRequest = { url: '/test', method: 'GET', headers: {} };
        mockResponse = { statusCode: 200 };
        mockContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue(mockRequest),
                getResponse: jest.fn().mockReturnValue(mockResponse),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        };
    });

    it('should wrap response in ApiResponse format', (done) => {
        const data = { id: '1', name: 'Test' };
        mockCallHandler = { handle: jest.fn().mockReturnValue(of(data)) };

        interceptor.intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe((result) => {
                expect(result.success).toBe(true);
                expect(result.data).toEqual(data);
                expect(result.statusCode).toBe(200);
                expect(result.meta).toBeDefined();
                expect(result.meta.path).toBe('/test');
                expect(result.meta.method).toBe('GET');
                done();
            });
    });

    it('should use default message when no decorator message', (done) => {
        const data = { id: '1' };
        mockCallHandler = { handle: jest.fn().mockReturnValue(of(data)) };

        interceptor.intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe((result) => {
                expect(result.message).toBe('Operación realizada correctamente');
                done();
            });
    });

    it('should use custom message from decorator', (done) => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue('Custom message');
        const data = { id: '1' };
        mockCallHandler = { handle: jest.fn().mockReturnValue(of(data)) };

        interceptor.intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe((result) => {
                expect(result.message).toBe('Custom message');
                done();
            });
    });

    it('should handle null data', (done) => {
        mockCallHandler = { handle: jest.fn().mockReturnValue(of(null)) };

        interceptor.intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe((result) => {
                expect(result.success).toBe(true);
                expect(result.data).toBeNull();
                done();
            });
    });

    it('should set x-request-id header on request', (done) => {
        const data = { id: '1' };
        mockCallHandler = { handle: jest.fn().mockReturnValue(of(data)) };

        interceptor.intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe(() => {
                expect(mockRequest.headers['x-request-id']).toBeDefined();
                expect(typeof mockRequest.headers['x-request-id']).toBe('string');
                done();
            });
    });
});
