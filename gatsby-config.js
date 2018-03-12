module.exports = {
    siteMetadata: {
        url: 'https://handsomeliuyang.github.io',
        title: 'Blog by LiuYang',
        subtitle: '探索，分享，创新——追求卓越',
        copyright: '© 2017 LiuYang',
        disqusShortname: '',
        menu: [
            {
                label: 'Articles',
                path: '/'
            },
            {
                label: 'About me',
                path: '/about/'
            },
            {
                label: 'Contact me',
                path: '/contact/'
            }
        ],
        author: {
            name: '刘阳',
            email: '40610243@qq.com',
            telegram: '18701318459',
            github: 'https://handsomeliuyang.github.io',
        }
    },
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-catch-links',
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: `${__dirname}/src/pages`,
                name: 'pages'
            }
        },
        {
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [
                    {
                        resolve: `gatsby-remark-images`,
                        options: {
                            // It's important to specify the maxWidth (in pixels) of
                            // the content container as this plugin uses this as the
                            // base for generating different widths of each image.
                            maxWidth: 960,
                        },
                    },
                    {
                        resolve: 'gatsby-remark-responsive-iframe',
                        options: { wrapperStyle: 'margin-bottom: 1.0725rem' }
                    },
                    'gatsby-remark-prismjs',
                    'gatsby-remark-copy-linked-files',
                ],
            },
        },
        'gatsby-plugin-postcss-sass',
        `gatsby-plugin-sharp`
    ],
};
