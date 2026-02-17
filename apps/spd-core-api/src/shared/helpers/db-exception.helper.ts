/**
 * Shared DB exception handler to reduce code duplication across services.
 */
import { BadRequestException, Logger } from "@nestjs/common";
import { ErrorCodes } from "@common/errors/error-codes";

/**
 * Handles common database exceptions (e.g., unique constraint violations).
 * @param error - The caught error
 * @param logger - Logger instance for non-handled errors
 * @param duplicateMessage - Custom message for duplicate entry errors
 * @param useErrorDetail - Whether to use error.detail as the message (default: false)
 */
export function handleDBExceptions(
    error: any,
    logger: Logger,
    duplicateMessage?: string,
    useErrorDetail: boolean = false,
): void {
    if (error.code === "23505") {
        if (useErrorDetail) {
            throw new BadRequestException({ message: error.detail, code: ErrorCodes.DUPLICATE_ENTRY });
        }
        throw new BadRequestException(duplicateMessage ?? "Ya existe un registro duplicado.");
    }
    logger.error(error);
}
