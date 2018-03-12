import React from 'react';
import Helmet from 'react-helmet';
import PostTemplateDetails from '../components/PostTemplateDetails';

class PostTemplate extends React.Component {
    render(){
        const { title, subtitle } = this.props.data.site.siteMetadata;
        const post = this.props.data.markdownRemark;
        const {title: postTitle} = post.frontmatter;

        return (
            <div>
                <Helmet>
                    <title>{`${postTitle} - ${title}`}</title>
                    <meta name="description" content={subtitle}/>
                </Helmet>
                <PostTemplateDetails {...this.props}/>
            </div>
        );
    }
}

export default PostTemplate;

export const pageQuery = graphql`
    query PostBySlug($slug: String!){
        site{
            siteMetadata {
                title
                subtitle
                copyright
                author {
                    name
                }
            }
        }
        markdownRemark(fields: { slug: {eq: $slug}}){
            id
            html
            fields {
                categorySlug
            }
            frontmatter {
                title
                date
                category
            }
        }
    }
`;