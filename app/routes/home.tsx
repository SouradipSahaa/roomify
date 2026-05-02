import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Upload from "../../components/Upload";
import Button from "../../components/ui/Button";
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {createProject, getProjects} from "../../lib/puter.action";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {

  const navigate = useNavigate();
  const [projects, setProjects] = useState<DesignItem[]>([]);
  const isCreatingProject = useRef(false);

  const handleUploadComplete = async (base64Image: string)=>{
    if (isCreatingProject.current) return false;
    isCreatingProject.current = true;

    const newId = Date.now().toString();
    const name = `Residence ${newId}`;
    const localProject: DesignItem = {
      id: newId,
      name,
      sourceImage: base64Image,
      timestamp: Date.now(),
    };

    setProjects((current) => [localProject, ...current]);
    navigate(`/visualizer/${newId}`, {
      state: {
        initialImage: base64Image,
        initialRender: null,
        name,
      },
    });

    createProject({ item: localProject })
        .then((project) => {
          if (!project) return;
          setProjects((current) =>
              current.map((item) => (item.id === project.id ? project : item)),
          );
        })
        .catch((error) => {
          console.warn("Project save failed after navigation", error);
        })
        .finally(() => {
          isCreatingProject.current = false;
        });

    return true;
  }

  useEffect(() => {
    let isMounted = true;

    getProjects().then((loadedProjects) => {
      if (isMounted) setProjects(loadedProjects);
    });

    return () => {
      isMounted = false;
    };
  }, []);
  return (
      <div className="home">
        <Navbar />
        <section className="hero">

          <div className="announce">
            <div className="dot">
              <div className="pulse"></div>
            </div>

            <p>Introducing Roomify 2.0</p>
          </div>

          <h1> Build beautiful spaces at the speed of thought with Roomify</h1>

          <p className="subtitle">
            Roomify is an AI-first design environment that helps you visualize, render, and ship architectural projects faster than ever.

          </p>

          <div className="actions">
            <a href="#upload" className="cta">
              Start Building <ArrowRight className="icon" />
            </a>

            <Button variant="outline" size="lg" className="demo">
              Watch Demo
            </Button>
          </div>

          <div id="upload" className="upload-shell">
            <div className="grid-overlay"/>

            <div className="upload-card">
              <div className="upload-head">
                <div className="upload-icon">
                  <Layers className="icon"/>
                </div>
                <h3>Upload your floor plan</h3>
                <p>Supports JPG, PNG, formats up to 10MB</p>
              </div>
              <Upload onComplete={handleUploadComplete}/>
            </div>
          </div>

        </section>

        <section className="projects">
          <div className="section-inner">
            <div className="section-head">
              <div className="copy">
                <h2>Projects</h2>
                <p>Your latest work and shared community projects, all in one place.</p>
              </div>
            </div>

            <div className="projects-grid">
              {projects.map(({ id, name, renderedImage, sourceImage, timestamp }) => (
                  <div
                      className="project-card group"
                      key={id}
                      onClick={() => navigate(`/visualizer/${id}`)}
                  >
                    <div className="preview">
                      <img src={renderedImage || sourceImage}
                           alt="Project"/>
                      <div className="badge">
                        <span>Project</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div>
                        <h3>{name || `Residence ${id}`}</h3>

                        <div className="meta">
                          <Clock size={12} />
                          <span>{new Date(timestamp).toLocaleDateString()}</span><span>By You</span>
                        </div>
                      </div>
                      <div className="arrow">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>
              ))}

              {projects.length === 0 && (
                  <div className="project-card group">
                <div className="preview">
                  <img src="https://roomify-mlhuk267-dfwu1i.puter.site/projects/1770803585402/rendered.png"
                       alt="Project"/>
                  <div className="badge">
                    <span>Community</span>
                  </div>
                </div>

                <div className="card-body">
                  <div>
                    <h3>Project Manhattan</h3>

                    <div className="meta">
                      <Clock size={12} />
                      <span>{new Date('01.01.2027').toLocaleDateString()}</span><span>By JS Mastery</span>
                    </div>
                  </div>
                  <div className="arrow">
                    <ArrowUpRight size={18} />
                  </div>


                </div>
              </div>
              )}
            </div>
          </div>
        </section>
      </div>
  )
}
