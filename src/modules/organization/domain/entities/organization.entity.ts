import { DomainError, ErrorCode } from "src/core";
import { GeneralUtils } from "src/utils/general.utils";
import { IOrganization, IOrganizationCreate } from "../types";
import { randomUUID } from "crypto";

export class OrganizationEntity {
  private props: IOrganization;

  private constructor(props: IOrganization) {
    this.props = props;
  }

  public static create(data: IOrganizationCreate) {
    const now = new Date();

    return new OrganizationEntity({
      id: randomUUID(),
      ...data,
      slug: GeneralUtils.generateSlug(data.name),
      siren: null,
      siret: null,
      vatNumber: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  canInviteMember(): void {
    // TODO : implémenter logique pour check abonnement et nombre max d'invitations
  }

  isSubscritionActive(): boolean {
    // TODO : vérifier si organization a un abonnement actif
    return true;
  }

  hasReachedMemberLimit(): boolean {
    // TODO : vérifier si le le nombre limite de personne à ajouté est atteint (basé sur l'abonnement)
    return true;
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get siren(): string | null {
    return this.props.siren;
  }
  get siret(): string | null {
    return this.props.siret;
  }
  get vatNumber(): string | null {
    return this.props.vatNumber;
  }
  get slug(): string {
    return this.props.slug;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IOrganization {
    return { ...this.props };
  }

  static reconstitute(data: IOrganization): OrganizationEntity {
    return new OrganizationEntity(data);
  }
}
