// / <reference types="cypress"/>
// / <reference types="../../../support"/>

import faker from "faker";

import { BUTTON_SELECTORS } from "../../../elements/shared/button-selectors";
import { SHIPPING_ZONE_DETAILS } from "../../../elements/shipping/shipping-zone-details";
import { WAREHOUSES_DETAILS } from "../../../elements/warehouses/warehouse-details";
import { WAREHOUSES_LIST } from "../../../elements/warehouses/warehouses-list";
import {
  shippingZoneDetailsUrl,
  urlList,
  warehouseDetailsUrl
} from "../../../fixtures/urlList";
import { createShippingZone } from "../../../support/api/requests/ShippingMethod";
import {
  createWarehouse as createWarehouseViaApi,
  getWarehouse
} from "../../../support/api/requests/Warehouse";
import { getDefaultChannel } from "../../../support/api/utils/channelsUtils";
import { deleteShippingStartsWith } from "../../../support/api/utils/shippingUtils";
import filterTests from "../../../support/filterTests";

filterTests({ definedTags: ["all"] }, () => {
  describe("Warehouse settings", () => {
    const startsWith = "CyWarehouse";
    let usAddress;

    before(() => {
      cy.clearSessionData().loginUserViaRequest();
      deleteShippingStartsWith(startsWith);
      cy.fixture("addresses").then(addresses => {
        usAddress = addresses.usAddress;
      });
    });

    beforeEach(() => {
      cy.clearSessionData().loginUserViaRequest();
    });

    xit("should create warehouse", () => {
      const name = `${startsWith}${faker.datatype.number()}`;
      cy.visit(urlList.warehouses)
        .get(WAREHOUSES_LIST.createNewButton)
        .click()
        .get(WAREHOUSES_DETAILS.nameInput)
        .type(name)
        .fillUpBasicAddress(usAddress)
        .addAliasToGraphRequest("WarehouseCreate")
        .get(BUTTON_SELECTORS.confirm)
        .click()
        .waitForRequestAndCheckIfNoErrors("@WarehouseCreate")
        .its("response.body.data.createWarehouse.warehouse")
        .then(warehouse => {
          getWarehouse(warehouse.id);
        })
        .then(warehouse => {
          const addressResp = warehouse.address;
          chai.softExpect(warehouse.name).to.be.eq(name);
          cy.expectCorrectBasicAddress(addressResp, usAddress);
        });
    });

    xit("should add warehouse to shipping zone", () => {
      const name = `${startsWith}${faker.datatype.number()}`;
      let defaultChannel;
      let warehouse;
      let shippingZone;

      getDefaultChannel()
        .then(channelResp => {
          defaultChannel = channelResp;
          createWarehouseViaApi({
            name,
            address: usAddress
          });
        })
        .then(warehouseResp => {
          warehouse = warehouseResp;
          createShippingZone(name, "US", defaultChannel.id);
        })
        .then(shippingZoneResp => {
          shippingZone = shippingZoneResp;
          cy.visit(shippingZoneDetailsUrl(shippingZone.id))
            .fillAutocompleteSelect(
              SHIPPING_ZONE_DETAILS.warehouseSelector,
              warehouse.name
            )
            .addAliasToGraphRequest("UpdateShippingZone")
            .get(BUTTON_SELECTORS.confirm)
            .click()
            .waitForRequestAndCheckIfNoErrors("@UpdateShippingZone");
          getWarehouse(warehouse.id);
        })
        .then(warehouseResp => {
          expect(warehouseResp.shippingZones.edges[0].node.id).to.be.eq(
            shippingZone.id
          );
        });
    });

    xit("should delete warehouse", () => {
      const name = `${startsWith}${faker.datatype.number()}`;
      createWarehouseViaApi({
        name,
        address: usAddress
      }).then(warehouse => {
        cy.visit(warehouseDetailsUrl(warehouse.id))
          .get(BUTTON_SELECTORS.deleteButton)
          .click()
          .addAliasToGraphRequest("WarehouseDelete")
          .get(BUTTON_SELECTORS.submit)
          .click()
          .waitForRequestAndCheckIfNoErrors("@WarehouseDelete");
        getWarehouse(warehouse.id).should("be.null");
      });
    });

    it("should add warehouse to shipping zone", () => {
      const name = `${startsWith}${faker.datatype.number()}`;
      let defaultChannel;
      let warehouse;
      let shippingZone;

      getDefaultChannel()
        .then(channelResp => {
          defaultChannel = channelResp;
          createShippingZone(name, "US", defaultChannel.id);
        })
        .then(shippingZoneResp => {
          shippingZone = shippingZoneResp;
          createWarehouseViaApi({
            name,
            shippingZone: shippingZone.id,
            address: usAddress
          });
        })
        .then(warehouseResp => {
          warehouse = warehouseResp;
          cy.visit(shippingZoneDetailsUrl(shippingZone.id))
            .pause()
            .fillAutocompleteSelect(
              SHIPPING_ZONE_DETAILS.warehouseSelector,
              warehouse.name
            )
            .addAliasToGraphRequest("UpdateShippingZone")
            .get(BUTTON_SELECTORS.confirm)
            .click()
            .waitForRequestAndCheckIfNoErrors("@UpdateShippingZone");
          getWarehouse(warehouse.id);
        })
        .then(warehouseResp => {
          expect(warehouseResp.shippingZones.edges[0].node.id).to.be.eq(
            shippingZone.id
          );
        });
    });
  });
});
