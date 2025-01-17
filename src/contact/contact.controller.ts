// Importing necessary decorators and modules for defining the ContactController.
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common'; // NestJS decorators to define routes and request handling.
import { ContactService } from './contact.service'; // Service for handling contact-related operations.
import { Auth } from '../common/auth.decorator'; // Custom decorator to retrieve authenticated user information.
import { User } from '@prisma/client'; // User model generated by Prisma, representing the authenticated user.
import {
  ContactResponse,
  CreateContactRequest,
  UpdateContactRequest,
} from '../model/contact.model'; // Models for request and response structures of contacts.
import { WebResponse } from '../model/web.model'; // A wrapper model for API responses.

// Defines the `ContactController` class to handle HTTP requests for the `/api/contacts` route.
@Controller('/api/contacts') // Maps all endpoints in this controller to start with `/api/contacts`.
export class ContactController {
  // Dependency injection for the ContactService to handle business logic.
  constructor(private contactService: ContactService) {}

  /**
   * Handles POST requests to create a new contact.
   *
   * @param user - The authenticated user initiating the request (retrieved using the `@Auth` decorator).
   * @param request - The payload for creating a new contact (parsed from the request body).
   * @returns A `WebResponse` object containing the created contact's details.
   */
  @Post() // Defines the endpoint for HTTP POST requests to `/api/contacts`.
  @HttpCode(200) // Sets the HTTP response status code to 200 (OK) for successful requests.
  async create(
    @Auth() user: User, // Custom `@Auth` decorator to inject the authenticated user into the method.
    @Body() request: CreateContactRequest, // The `@Body` decorator parses the incoming JSON payload into a `CreateContactRequest` object.
  ): Promise<WebResponse<ContactResponse>> {
    // Calls the `create` method of the ContactService to handle the contact creation logic.
    const result = await this.contactService.create(user, request);

    // Wraps the result in a `WebResponse` object before returning it.
    return {
      data: result, // Contains the created contact's details in the response body.
    };
  }

  /**
   * Handles GET requests to retrieve a specific contact by its ID.
   *
   * @param user - The authenticated user initiating the request, injected via the custom `@Auth` decorator.
   * @param contactId - The ID of the contact to retrieve, validated and parsed using `ParseIntPipe`.
   * @returns A `WebResponse` object containing the requested contact's details.
   */
  @Get('/:contactId') // Maps HTTP GET requests to `/api/contacts/:contactId`.
  @HttpCode(200) // Sets the HTTP response status code to 200 (OK) for successful requests.
  async get(
    @Auth() user: User, // Retrieves the authenticated user information using the custom `@Auth` decorator.
    @Param('contactId', ParseIntPipe) contactId: number, // Validates and parses the `contactId` parameter into a number.
  ): Promise<WebResponse<ContactResponse>> {
    // Calls the `get` method of `ContactService` to fetch the contact details by ID.
    const result = await this.contactService.get(user, contactId);
    // Wraps the fetched contact's details in a `WebResponse` object and returns it.
    return {
      data: result, // The contact details returned by the `get` method.
    };
  }

  @Put('/:contactId') // Maps HTTP PUT requests to this method for the specified route.
  @HttpCode(200) // Sets the HTTP response status code to 200 (OK).
  async update(
    @Auth() user: User, // Injects the authenticated user's information from the request.
    @Param('contactId', ParseIntPipe) contactId: number, // Extracts the `contactId` parameter from the route and parses it as an integer.
    @Body() request: UpdateContactRequest, // Extracts the request body and binds it to the `UpdateContactRequest` model.
  ): Promise<WebResponse<ContactResponse>> {
    // Assigns the extracted `contactId` to the `id` property of the `UpdateContactRequest`.
    request.id = contactId;

    // Calls the `update` method in the `ContactService` to update the contact.
    const result = await this.contactService.update(user, request);

    // Returns a structured response containing the updated contact details.
    return {
      data: result, // The result of the update operation.
    };
  }

  // Endpoint to handle the removal of a contact by contact ID.
  @Delete('/:contactId') // HTTP DELETE method to delete a contact based on the contactId parameter.
  @HttpCode(200) // Sets the HTTP status code to 200 OK for a successful request.
  async remove(
    @Auth() user: User, // The authenticated user making the request.
    @Param('contactId', ParseIntPipe) contactId: number, // The contact ID to be deleted, parsed to a number.
  ): Promise<WebResponse<boolean>> {
    // Calls the remove method from the ContactService to delete the contact.
    await this.contactService.remove(user, contactId);

    // Returns a response indicating the success of the deletion operation.
    return {
      data: true, // Indicates that the contact was successfully deleted.
    };
  }
}
