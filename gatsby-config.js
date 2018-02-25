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
            name: 'LiuYang',
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
        'gatsby-transformer-remark',
    ],
};
