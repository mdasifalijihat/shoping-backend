import { Router } from "express";
import navbarRouter from "../modules/navbar/navbar.route.js";
import homepageSectionRouter from "../modules/homepageSection/homepageSection.route.js";
import siteSettingRouter from "../modules/siteSetting/siteSetting.route.js";
import customPageRouter from "../modules/customPage/customPage.route.js";

import categoryRouter from "../modules/category/category.route.js";
import attributeRouter from "../modules/attribute/attribute.route.js";
import productRouter from "../modules/product/product.route.js";

import paymentMethodRouter from "../modules/paymentMethod/paymentMethod.route.js";
import shippingZoneRouter from "../modules/shippingZone/shippingZone.route.js";
import couponRouter from "../modules/coupon/coupon.route.js";

import cartRouter from "../modules/cart/cart.route.js";
import orderRouter from "../modules/order/order.route.js";
import reviewRouter from "../modules/review/review.route.js";

import userRouter from "../modules/user/user.route.js";
import adminRouter from "../modules/admin/admin.route.js";
import mediaRouter from "../modules/media/media.route.js";

const router = Router();

router.use("/users", userRouter);
router.use("/admin", adminRouter);

router.use("/navbar", navbarRouter);
router.use("/homepage-sections", homepageSectionRouter);
router.use("/site-settings", siteSettingRouter);
router.use("/pages", customPageRouter);

router.use("/categories", categoryRouter);
router.use("/attributes", attributeRouter);
router.use("/products", productRouter);

router.use("/payment-methods", paymentMethodRouter);
router.use("/shipping-zones", shippingZoneRouter);
router.use("/coupons", couponRouter);

router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/reviews", reviewRouter);

router.use("/media", mediaRouter);

export default router;
