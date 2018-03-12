import React from 'react';
import Link from 'gatsby-link';
import moment from 'moment';
import './style.scss';

class PostTemplateDetails extends React.Component {
    render(){
        const {subtitle, author} = this.props.data.site.siteMetadata;
        const post = this.props.data.markdownRemark;

        return (
            <div>
                <div className="post-single">
                    <div className="post-single__inner">
                        <h1 className="post-single__title">{post.frontmatter.title}</h1>
                        <div className="post-single__date">
                            <em>Published {moment(post.frontmatter.date).format('YYYY-MM-DD')}</em>
                        </div>
                        <div className="post-single__body" dangerouslySetInnerHTML={{ __html: post.html }} />
                    </div>
                    <div className="post-single__footer">
                        footer底部栏
                    </div>
                </div>
            </div>
        );
    }
}

export default PostTemplateDetails;