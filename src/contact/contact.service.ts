// Importing necessary decorators, services, and models for the ContactService.
import { HttpException, Inject, Injectable } from '@nestjs/common'; // `Injectable` is used to mark the class as a service in NestJS.
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'; // Used to inject the Winston logger.
import { PrismaService } from '../common/prisma.service'; // Service for interacting with the Prisma ORM.
import { Logger } from 'winston'; // Logger interface from the Winston logging library.
import { Contact, User } from '@prisma/client'; // User model generated by Prisma.
import { ContactResponse, CreateContactRequest } from '../model/contact.model'; // Models for Contact data.
import { ValidationService } from '../common/validation.service'; // Service for validating request data.
import { ContactValidation } from './contact.validation'; // Validation schema for contact data.

// Marking the class as a service using the `@Injectable` decorator.
@Injectable()
export class ContactService {
  // Constructor dependency injection for required services.
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger, // Injects the Winston logger for logging.
    private prismaService: PrismaService, // Provides methods for interacting with the database.
    private validationService: ValidationService, // Handles input validation using predefined schemas.
  ) {}

  /**
   * Handles the creation of a new contact.
   *
   * @param user - The user initiating the request, typically obtained from authentication.
   * @param request - The data payload for creating a contact.
   * @returns A promise that resolves to a `ContactResponse` containing the newly created contact's details.
   */
  async create(
    user: User, // The authenticated user information.
    request: CreateContactRequest, // Input data for the contact creation.
  ): Promise<ContactResponse> {
    // Logs the user and request data for debugging purposes.
    this.logger.debug(
      `ContactService.create(${JSON.stringify(user)}, ${JSON.stringify(request)})`,
    );
    // Validate the incoming request data using the ContactValidation schema.
    const createRequest: CreateContactRequest = this.validationService.validate(
      ContactValidation.CREATE, // Schema for validating the creation request.
      request, // The input data to be validated.
    );

    // Use Prisma to create a new contact in the database.
    const contact = await this.prismaService.contact.create({
      data: {
        ...createRequest, // Spreads the validated input data into the creation payload.
        ...{ username: user.username }, // Adds the username from the authenticated user.
      },
    });

    // Converts the contact database entity into a structured response object and returns it.
    return this.toContactResponse(contact);
  }

  /**
   * Converts a Prisma `Contact` entity into a `ContactResponse` format.
   *
   * @param contact - The contact entity retrieved from the database.
   * @returns A `ContactResponse` object with the contact's details.
   */
  toContactResponse(contact: Contact): ContactResponse {
    return {
      first_name: contact.first_name, // The first name of the contact.
      last_name: contact.last_name, // The last name of the contact.
      email: contact.email, // The email address of the contact.
      phone: contact.phone, // The phone number of the contact.
      id: contact.id, // The unique identifier of the contact.
    };
  }

  /**
   * Retrieves the details of a specific contact belonging to a user.
   *
   * @param user - The authenticated user's information.
   * @param contactId - The unique ID of the contact to be retrieved.
   * @returns A promise that resolves to a `ContactResponse` with the contact's details.
   */
  async get(user: User, contactId: number): Promise<ContactResponse> {
    // Queries the database to find the contact by ID and ensure it belongs to the authenticated user.
    const contact = await this.prismaService.contact.findFirst({
      where: {
        username: user.username, // Ensures the contact belongs to the requesting user.
        id: contactId, // Matches the contact ID.
      },
    });

    // Throws an HTTP exception if the contact is not found.
    if (!contact) {
      throw new HttpException('Contact is not found', 400); // Returns a 400 Bad Request error with a descriptive message.
    }

    // Converts the contact entity into a structured response format and returns it.
    return this.toContactResponse(contact);
  }
}
