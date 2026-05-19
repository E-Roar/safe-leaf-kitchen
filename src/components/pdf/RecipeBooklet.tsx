import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer';
import { Recipe } from '@/data/recipes';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#064e3b',
        padding: 0,
        position: 'relative',
    },
    backgroundLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.18,
    },
    backgroundLayerCover: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.35,
    },
    contentContainer: {
        padding: 40,
        flex: 1,
        zIndex: 10,
    },
    // Cover Page Styles
    coverPage: {
        flexDirection: 'column',
        backgroundColor: '#064e3b',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    coverBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 40,
        backgroundColor: '#10b981',
    },
    coverLogo: {
        width: 160,
        height: 160,
        marginBottom: 50,
        borderRadius: 80,
    },
    coverTitle: {
        fontSize: 56,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 3,
    },
    coverSlogan: {
        fontSize: 20,
        color: '#10b981',
        marginBottom: 30,
        fontStyle: 'italic',
        letterSpacing: 2,
    },
    coverSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 40,
    },
    // About Page Styles
    aboutTitle: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    aboutText: {
        fontSize: 12,
        color: '#e2e8f0',
        marginBottom: 18,
        lineHeight: 1.8,
        textAlign: 'justify',
    },
    aboutSignature: {
        fontSize: 14,
        color: '#10b981',
        fontStyle: 'italic',
        marginTop: 30,
        textAlign: 'right',
    },
    // TOC Styles
    tocTitle: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#10b981',
        paddingBottom: 15,
    },
    tocEntry: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tocRecipeName: {
        fontSize: 14,
        color: '#e2e8f0',
        flex: 1,
    },
    tocDots: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dotted',
        marginHorizontal: 10,
    },
    tocPageNumber: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: 'bold',
        width: 40,
        textAlign: 'right',
    },
    // Recipe Data Page (Spread Left)
    recipeTitle: {
        fontSize: 34,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    recipeSubTitle: {
        fontSize: 13,
        color: '#10b981',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
        paddingBottom: 12,
    },
    metaItem: {
        fontSize: 10,
        color: '#94a3b8',
    },
    mainImage: {
        width: '100%',
        height: 260,
        borderRadius: 14,
        objectFit: 'cover',
        marginBottom: 25,
    },
    columns: {
        flexDirection: 'row',
        gap: 25,
    },
    leftCol: {
        width: '35%',
    },
    rightCol: {
        width: '65%',
    },
    sectionHeader: {
        fontSize: 15,
        color: '#10b981',
        fontWeight: 'bold',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    ingredient: {
        fontSize: 10,
        color: '#e2e8f0',
        marginBottom: 7,
        lineHeight: 1.4,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#059669',
    },
    step: {
        fontSize: 10,
        color: '#f8fafc',
        marginBottom: 10,
        lineHeight: 1.6,
    },
    stepNumber: {
        color: '#10b981',
        fontWeight: 'bold',
        marginRight: 6,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 18,
    },
    nutritionBadge: {
        padding: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        width: '22%',
        alignItems: 'center',
    },
    badgeVal: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    badgeLabel: {
        fontSize: 7,
        color: '#10b981',
        marginTop: 2,
    },
    // Gallery Page (Spread Right)
    galleryTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    masonry: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    galleryImg: {
        width: '48%',
        height: 200,
        borderRadius: 12,
        objectFit: 'cover',
    },
    quoteSection: {
        marginTop: 35,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
        paddingTop: 20,
    },
    quoteText: {
        color: '#94a3b8',
        fontSize: 11,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    footerPage: {
        position: 'absolute',
        bottom: 20,
        right: 40,
        fontSize: 9,
        color: '#64748b',
    },
    // Back Cover Styles
    backCoverContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        zIndex: 10,
    },
    backCoverQR: {
        width: 140,
        height: 140,
        marginBottom: 30,
    },
    backCoverTitle: {
        fontSize: 22,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    creditsText: {
        fontSize: 14,
        color: '#10b981',
        marginBottom: 50,
    },
    copyrightSection: {
        position: 'absolute',
        bottom: 60,
        left: 40,
        right: 40,
        alignItems: 'center',
    },
    copyrightText: {
        fontSize: 9,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 6,
    },
    disclaimerText: {
        fontSize: 8,
        color: '#475569',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 1.5,
    },
});

interface RecipeBookletProps {
    recipes: Recipe[];
    qrCodeDataUrl: string;
    origin?: string;
}

const resolveImageUrl = (path: string, origin: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.split('#')[0].split('?')[0];
    return `${origin}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

// Get gallery images - auto-detect from local folder if not provided
const getGalleryImages = (recipe: Recipe, origin: string): string[] => {
    // If recipe has uploaded gallery images, use them
    if (recipe.gallery_images && recipe.gallery_images.length > 0) {
        return recipe.gallery_images.map(img => resolveImageUrl(img, origin));
    }
    // Auto-detect from local folder (images 2-5)
    const folderName = recipe.title.en
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
    return [2, 3, 4, 5].map(n => resolveImageUrl(`/images/recipes/${folderName}/${n}.png`, origin));
};

// Get main image for recipe
const getMainImage = (recipe: Recipe, origin: string): string => {
    if (recipe.image_url) return resolveImageUrl(recipe.image_url, origin);
    const folderName = recipe.title.en
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
    return resolveImageUrl(`/images/recipes/${folderName}/1.png`, origin);
};

// Inspirational quotes for gallery pages
const quotes = [
    "Cooking is the art of turning nature into nourishment. These leaves, once discarded, now feed our health and the planet.",
    "In every leaf lies hidden treasure—nutrition, flavor, and the wisdom of generations past.",
    "Sustainable cooking begins with seeing value where others see waste.",
    "From field to fork, we honor nature's complete bounty.",
];

export const RecipeBooklet = ({ recipes, qrCodeDataUrl, origin = '' }: RecipeBookletProps) => {
    const bgUrl = resolveImageUrl('/images/hero-leafy-background.jpg', origin);
    const logoUrl = resolveImageUrl('/icons/icon-512x512.png', origin);

    // Calculate page numbers: Cover(1) + About(2) + TOC(3) + recipes start at 4
    const getRecipePageNumber = (index: number) => 4 + (index * 2);

    return (
        <Document title="Safe Leaf Kitchen Cookbook" author="Safe Leaf Kitchen" subject="Sustainable Recipes from Nature's Hidden Gems">
            {/* Page 1: Cover */}
            <Page size="A4" style={styles.coverPage}>
                <Image src={bgUrl} style={styles.backgroundLayerCover} />
                <View style={styles.coverBorder} />
                <Image src={logoUrl} style={styles.coverLogo} />
                <Text style={styles.coverTitle}>SAFE LEAF</Text>
                <Text style={styles.coverTitle}>KITCHEN</Text>
                <Text style={styles.coverSlogan}>Recipes from Nature's Hidden Gems</Text>
                <Text style={styles.coverSubtitle}>A Collection of Nutritious Sustainable Recipes</Text>
            </Page>

            {/* Page 2: About */}
            <Page size="A4" style={styles.page}>
                <Image src={bgUrl} style={styles.backgroundLayerCover} />
                <View style={styles.contentContainer}>
                    <Text style={styles.aboutTitle}>About This Cookbook</Text>

                    <Text style={styles.aboutText}>
                        Welcome to Safe Leaf Kitchen, a culinary collection celebrating the hidden nutritional
                        treasures found in leafy greens often discarded as waste. These recipes transform
                        traditional knowledge into modern, sustainable cuisine that nourishes both body and planet.
                    </Text>

                    <Text style={styles.aboutText}>
                        SafeLeafKitchen is a research-driven initiative founded on the scientific vision of Dr. Jamila El Biyad,
                        whose work is the primary driver behind the application. Her research at the intersection of food safety,
                        nutrition, ecology, and resource valuation directly inspired the creation of this platform.
                    </Text>

                    <Text style={styles.aboutText}>
                        By translating scientific research into an accessible digital tool, SafeLeafKitchen serves consumers,
                        researchers, and nutrition professionals, while contributing to improved public health, ecological
                        sustainability, and the economic valorization of Moroccan natural resources.
                    </Text>

                    <Text style={styles.aboutText}>
                        We invite you to explore these recipes and discover the rich flavors and profound
                        nutritional value hidden in nature's forgotten gems. May each dish bring health,
                        joy, and a deeper connection to the food we eat.
                    </Text>

                    <Text style={styles.aboutSignature}>— The Safe Leaf Kitchen Team</Text>

                    <Link src="https://www.researchgate.net/profile/Jamila-Elbiyad" style={{ textDecoration: 'none' }}>
                        <Text style={{ ...styles.aboutSignature, fontSize: 10, marginTop: 5, color: '#34d399' }}>
                            Research Profile: Dr. Jamila El Biyad
                        </Text>
                    </Link>
                </View>
                <Text style={styles.footerPage}>SAFE LEAF KITCHEN | PAGE 2</Text>
            </Page>

            {/* Page 3: Table of Contents */}
            <Page size="A4" style={styles.page} id="toc">
                <Image src={bgUrl} style={styles.backgroundLayerCover} />
                <View style={styles.contentContainer}>
                    <Text style={styles.tocTitle}>Table of Contents</Text>

                    {recipes.map((recipe, idx) => (
                        <Link key={recipe.id} src={`#recipe-${recipe.id}`} style={{ textDecoration: 'none' }}>
                            <View style={styles.tocEntry}>
                                <Text style={styles.tocRecipeName}>{recipe.title.en}</Text>
                                <View style={styles.tocDots} />
                                <Text style={styles.tocPageNumber}>{getRecipePageNumber(idx)}</Text>
                            </View>
                        </Link>
                    ))}
                </View>
                <Text style={styles.footerPage}>SAFE LEAF KITCHEN | PAGE 3</Text>
            </Page>

            {/* Recipe Spreads */}
            {recipes.map((recipe, idx) => {
                const mainImg = getMainImage(recipe, origin);
                const galleryImages = getGalleryImages(recipe, origin);
                const pageNum = getRecipePageNumber(idx);
                const quote = quotes[idx % quotes.length];

                return (
                    <React.Fragment key={recipe.id}>
                        {/* Spread Left: Recipe Information */}
                        <Page size="A4" style={styles.page} id={`recipe-${recipe.id}`}>
                            <Image src={bgUrl} style={styles.backgroundLayer} />
                            <View style={styles.contentContainer}>
                                <Text style={styles.recipeTitle}>{recipe.title.en}</Text>
                                <Text style={styles.recipeSubTitle}>Traditional & Sustainable Cuisine</Text>

                                <View style={styles.metaRow}>
                                    <Text style={styles.metaItem}>• 30 MINS PREP</Text>
                                    <Text style={styles.metaItem}>• 4 SERVINGS</Text>
                                    <Text style={styles.metaItem}>• {recipe.nutrition.antioxidant_score.toUpperCase()} ANTIOXIDANTS</Text>
                                </View>

                                {mainImg && <Image src={mainImg} style={styles.mainImage} />}

                                <View style={styles.columns}>
                                    <View style={styles.leftCol}>
                                        <Text style={styles.sectionHeader}>Ingredients</Text>
                                        {(recipe.ingredients.en || []).map((ing, i) => (
                                            <Text key={i} style={styles.ingredient}>{ing}</Text>
                                        ))}
                                    </View>
                                    <View style={styles.rightCol}>
                                        <Text style={styles.sectionHeader}>Instructions</Text>
                                        {(recipe.steps.en || []).map((step, i) => (
                                            <Text key={i} style={styles.step}>
                                                <Text style={styles.stepNumber}>{i + 1}.</Text> {step}
                                            </Text>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.nutritionGrid}>
                                    <View style={styles.nutritionBadge}>
                                        <Text style={styles.badgeVal}>{recipe.nutrition.proteins_g}g</Text>
                                        <Text style={styles.badgeLabel}>Protein</Text>
                                    </View>
                                    <View style={styles.nutritionBadge}>
                                        <Text style={styles.badgeVal}>{recipe.nutrition.polyphenols_mg}mg</Text>
                                        <Text style={styles.badgeLabel}>Polyphenols</Text>
                                    </View>
                                    <View style={styles.nutritionBadge}>
                                        <Text style={styles.badgeVal}>{recipe.nutrition.moisture_percent}%</Text>
                                        <Text style={styles.badgeLabel}>Moisture</Text>
                                    </View>
                                    <View style={styles.nutritionBadge}>
                                        <Text style={styles.badgeVal}>{recipe.nutrition.calories_kcal || '120'}kcal</Text>
                                        <Text style={styles.badgeLabel}>Calories</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.footerPage}>SAFE LEAF KITCHEN | PAGE {pageNum}</Text>
                        </Page>

                        {/* Spread Right: Gallery */}
                        <Page size="A4" style={styles.page}>
                            <Image src={bgUrl} style={styles.backgroundLayer} />
                            <View style={styles.contentContainer}>
                                <Text style={styles.galleryTitle}>Visual Experience</Text>
                                <View style={styles.masonry}>
                                    {galleryImages.slice(0, 4).map((img, gi) => (
                                        <Image
                                            key={gi}
                                            src={img}
                                            style={styles.galleryImg}
                                        />
                                    ))}
                                </View>
                                <View style={styles.quoteSection}>
                                    <Text style={styles.quoteText}>"{quote}"</Text>
                                </View>
                            </View>
                            <Text style={styles.footerPage}>SAFE LEAF KITCHEN | PAGE {pageNum + 1}</Text>
                        </Page>
                    </React.Fragment>
                );
            })}

            {/* Back Cover */}
            <Page size="A4" style={styles.coverPage}>
                <Image src={bgUrl} style={styles.backgroundLayerCover} />
                <View style={styles.backCoverContent}>
                    <Image src={qrCodeDataUrl} style={styles.backCoverQR} />
                    <Text style={styles.backCoverTitle}>Visit Us Online</Text>
                    <Text style={styles.creditsText}>safe-leaf-kitchen.solvefactory.fun</Text>
                </View>
                <View style={styles.copyrightSection}>
                    <Text style={styles.copyrightText}>
                        © 2026 Safe Leaf Kitchen. All rights reserved.
                    </Text>
                    <Text style={styles.copyrightText}>
                        No part of this publication may be reproduced, distributed, or transmitted
                    </Text>
                    <Text style={styles.copyrightText}>
                        in any form without prior written permission of the publisher.
                    </Text>
                    <Text style={styles.copyrightText}>
                        Recipes developed by Dr. Jamila | Photography & Design by SolveFactory
                    </Text>
                    <Text style={styles.disclaimerText}>
                        The nutritional information in this cookbook is provided for educational purposes only.
                        Consult a healthcare professional before making dietary changes.
                        While every effort has been made to ensure accuracy, the publisher assumes no liability.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
