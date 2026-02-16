import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from '../../../apps/spd-core-api/src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;
    let mockReply: jest.Mock;
    let mockGetRequestUrl: jest.Mock;
    let mockGetRequestMethod: jest.Mock;
    let mockResponse: any;
    let mockRequest: any;
    let mockHost: any;

    beforeEach(() => {
        mockReply = jest.fn();
        mockGetRequestUrl = jest.fn().mockReturnValue('/test');
        mockGetRequestMethod = jest.fn().mockReturnValue('GET');
        mockResponse = {};
        mockRequest = { headers: { 'x-request-id': 'test-req-id' } };
        mockHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: jest.fn().mockReturnValue(mockResponse),
                getRequest: jest.fn().mockReturnValue(mockRequest),
            }),
        };

        const httpAdapterHost = {
            httpAdapter: {
                reply: mockReply,
                getRequestUrl: mockGetRequestUrl,
                getRequestMethod: mockGetRequestMethod,
            },
        } as unknown as HttpAdapterHost;

        filter = new AllExceptionsFilter(httpAdapterHost);
    });

    it('should handle HttpException with string response', () => {
        const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
        filter.catch(exception, mockHost as any);

        expect(mockReply).toHaveBeenCalledWith(mockResponse, expect.any(Object), HttpStatus.NOT_FOUND);
        const body = mockReply.mock.calls[0][1];
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle HttpException with object response', () => {
        const exception = new HttpException({ message: 'Custom error', code: 'E001' }, HttpStatus.BAD_REQUEST);
        filter.catch(exception, mockHost as any);

        expect(mockReply).toHaveBeenCalledWith(mockResponse, expect.any(Object), HttpStatus.BAD_REQUEST);
        const body = mockReply.mock.calls[0][1];
        expect(body.success).toBe(false);
        expect(body.message).toBe('Custom error');
    });

    it('should handle HttpException with validation errors array', () => {
        const exception = new HttpException(
            { message: ['field must not be empty', 'field must be string'] },
            HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, mockHost as any);

        const body = mockReply.mock.calls[0][1];
        expect(body.success).toBe(false);
        expect(body.errors).toBeDefined();
        expect(body.message).toBe('Errores de validación');
    });

    it('should handle non-HttpException as 500', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const exception = new Error('Something broke');
        filter.catch(exception, mockHost as any);

        expect(mockReply).toHaveBeenCalledWith(mockResponse, expect.any(Object), HttpStatus.INTERNAL_SERVER_ERROR);
        const body = mockReply.mock.calls[0][1];
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include meta with requestId, timestamp, path, method', () => {
        const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
        filter.catch(exception, mockHost as any);

        const body = mockReply.mock.calls[0][1];
        expect(body.meta).toBeDefined();
        expect(body.meta.requestId).toBe('test-req-id');
        expect(body.meta.timestamp).toBeDefined();
        expect(body.meta.path).toBe('/test');
        expect(body.meta.method).toBe('GET');
    });

    it('should generate requestId when header is missing', () => {
        mockRequest.headers = {};
        const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
        filter.catch(exception, mockHost as any);

        const body = mockReply.mock.calls[0][1];
        expect(body.meta.requestId).toBeDefined();
        expect(typeof body.meta.requestId).toBe('string');
    });

    it('should extract extra properties as errorData', () => {
        const exception = new HttpException(
            { message: 'err', code: 'E01', extra: 'value' },
            HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, mockHost as any);

        const body = mockReply.mock.calls[0][1];
        expect(body.errors).toBeDefined();
        expect(body.errors.code).toBe('E01');
        expect(body.errors.extra).toBe('value');
    });
});
