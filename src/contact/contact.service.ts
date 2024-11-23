// Importing necessary decorators, services, and models for the ContactService.
import { HttpException, Inject, Injectable } from '@nestjs/common'; // `Injectable` is used to mark the class as a service in NestJS.
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'; // Used to inject the Winston logger.
import { PrismaService } from '../common/prisma.service'; // Service for interacting with the Prisma ORM.
import { Logger } from 'winston'; // Logger interface from the Winston logging library.
import { Contact, User } from '@prisma/client'; // User model generated by Prisma.
import {
  ContactResponse,
  CreateContactRequest,
  UpdateContactRequest,
} from '../model/contact.model'; // Models for Contact data.
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
   * Ensures that a contact exists in the database and is associated with the specified user.
   *
   * @param username - The username of the authenticated user.
   * @param contactId - The unique identifier of the contact.
   * @returns A `Contact` entity if found.
   * @throws HttpException if the contact does not exist or is not associated with the user.
   */
  async checkContactMustExists(
    username: string,
    contactId: number,
  ): Promise<Contact> {
    // Queries the database for the contact using the provided username and contact ID.
    const contact = await this.prismaService.contact.findFirst({
      where: {
        username: username, // Ensures the contact belongs to the user.
        id: contactId, // Matches the contact by its unique identifier.
      },
    });

    // Throws an exception if the contact is not found.
    if (!contact) {
      throw new HttpException('Contact is not found', 404); // Error: Contact not found.
    }

    return contact; // Returns the contact if found.
  }

  /**
   * Retrieves details of a specific contact associated with the authenticated user.
   *
   * @param user - The authenticated user's details.
   * @param contactId - The unique ID of the contact to retrieve.
   * @returns A promise that resolves to a `ContactResponse` containing the contact's details.
   */
  async get(user: User, contactId: number): Promise<ContactResponse> {
    // Ensures the contact exists and is associated with the user.
    const contact = await this.checkContactMustExists(user.username, contactId);

    // Converts the contact entity into a structured response format and returns it.
    return this.toContactResponse(contact);
  }

  /**
   * Updates an existing contact in the database.
   *
   * @param user - The authenticated user's details.
   * @param request - The data payload containing the updated contact details.
   * @returns A promise that resolves to a `ContactResponse` containing the updated contact's details.
   */
  async update(
    user: User, // The authenticated user's details.
    request: UpdateContactRequest, // Input data for updating the contact.
  ): Promise<ContactResponse> {
    // Validates the update request using a predefined schema.
    const updateRequest = this.validationService.validate(
      ContactValidation.UPDATE, // Validation schema for update requests.
      request, // Data to validate.
    );

    // Ensures the contact exists and belongs to the user.
    let contact = await this.checkContactMustExists(
      user.username, // Authenticated user's username.
      updateRequest.id, // Contact ID to update.
    );

    // Updates the contact in the database with the validated data.
    contact = await this.prismaService.contact.update({
      where: {
        id: contact.id, // Matches the contact by ID.
        username: contact.username, // Ensures the contact belongs to the user.
      },
      data: updateRequest, // Updated data for the contact.
    });

    // Converts the updated contact entity into a structured response and returns it.
    return this.toContactResponse(contact);
  }
}