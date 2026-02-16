import { PermissionsGuard } from '../../../apps/spd-core-api/src/common/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;
    let mockReflector: Partial<Reflector>;

    beforeEach(() => {
        mockReflector = {
            getAllAndOverride: jest.fn(),
        };
        guard = new PermissionsGuard(mockReflector as Reflector);
    });

    function createMockContext(user?: any): ExecutionContext {
        return {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue({ user }),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as any;
    }

    it('should allow access when no permissions are required', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
        const context = createMockContext({ permissions: {} });

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user has no permissions object', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ modulePath: '/test', actionCode: 'READ' });
        const context = createMockContext({});

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user does not have the required module', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ modulePath: '/test', actionCode: 'READ' });
        const context = createMockContext({
            permissions: { '/other': { actions: { READ: { allowed: true } } } },
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when action is not allowed', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ modulePath: '/test', actionCode: 'DELETE' });
        const context = createMockContext({
            permissions: { '/test': { actions: { DELETE: { allowed: false } } } },
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when action is allowed', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ modulePath: '/test', actionCode: 'READ' });
        const context = createMockContext({
            permissions: { '/test': { actions: { READ: { allowed: true } } } },
        });

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when no user in request', () => {
        (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ modulePath: '/test', actionCode: 'READ' });
        const context = createMockContext(undefined);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
});
